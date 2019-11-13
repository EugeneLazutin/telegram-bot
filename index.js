const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

const spreadsheetId = '1c2q8foww7nhmPODR9ehpA7K1OBvpxxei0tCgy-JvBp4';
const userName = 'Лазутин Евгений';

const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
const months = {
    0: 'январь',
    1: 'февраль',
    2: 'март',
    3: 'апрель',
    4: 'май',
    5: 'июнь',
    6: 'июль',
    7: 'август',
    8: 'сентябрь',
    9: 'октябрь',
    10: 'ноябрь',
    11: 'декабрь'
};

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), mainCallback);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error while trying to retrieve access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

function mainCallback(auth) {
    const sheetsV4 = google.sheets({ version: 'v4', auth });

    getSheets(sheetsV4).then(findCurrentSheet)
        .then((sheet) => {
            if(sheet) {
                const title = sheet.properties.title;
                getValues(sheetsV4, title).then((values) => {
                    let range = findCellRange(values, userName);
                    if (range) {
                        range = title + '!' + range;
                        writeCellData(sheetsV4, range, 'да');
                    }
                });
            }
        });
}

function getSheets(sheetsV4) {
    return new Promise((resolve) => {
        sheetsV4.spreadsheets.get({
            spreadsheetId
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            resolve(res.data.sheets);
        });
    });
}

function findCurrentSheet(sheets) {
    const now = new Date();
    const month = months[now.getMonth()];
    const year = now.getFullYear();

    const fullRegExp = new RegExp(`${month}&${year}`, 'i');
    const monthRegExp = new RegExp(month, 'i');

    let sheet = sheets.find((sheet) => fullRegExp.test(sheet.properties.title));
    if (!sheet) {
        sheet = sheets.find((sheet) => monthRegExp.test(sheet.properties.title));
    }
    if (sheet) {
        console.log(`Found sheet with the title "${sheet.properties.title}". Pattern - "${month}, ${year}"`);
        return sheet;
    }
    console.log('Sheet was not found! =( ', `Pattern - "${month}, ${year}"`);
    return null;
}

function writeCellData(sheets, range, value) {
    sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [[value]]
        }
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        console.log('\n\nUpdated!');
    });
}

function getValues(sheetsV4, range) {
    return new Promise((resolve) => {
        sheetsV4.spreadsheets.values.get({ spreadsheetId, range }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            resolve(res.data.values);
        });
    });
}

function findCellRange(values, userName) {
    const now = new Date();
    const date = `${now.getDate()}.${now.getMonth() + 1}`;
    const dateIndex = values[0].indexOf(date);
    const userIndex = values.map((row) => row[0]).indexOf(userName);
    if (dateIndex !== -1 && userIndex !== -1) {
        return alphabet[dateIndex] + (userIndex + 1);
    }
    return null;
}
