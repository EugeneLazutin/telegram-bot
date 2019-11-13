const { google } = require('googleapis');
const { alphabet, months } = require('./contstants');

module.exports = function writeData(auth, spreadsheetId, userName, valueToWrite) {
    const sheetsV4 = google.sheets({ version: 'v4', auth });

    getSheets(sheetsV4, spreadsheetId).then(findCurrentSheet)
        .then((sheet) => {
            if (sheet) {
                const title = sheet.properties.title;
                getValues(sheetsV4, spreadsheetId, title).then((values) => {
                    let range = findCellRange(values, userName);
                    if (range) {
                        range = title + '!' + range;
                        writeCellData(sheetsV4, spreadsheetId, range, valueToWrite);
                    }
                });
            }
        });
}

function getSheets(sheetsV4, spreadsheetId) {
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

function writeCellData(sheetsV4, spreadsheetId, range, value) {
    sheetsV4.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [[value]]
        }
    }, (err) => {
        if (err) return console.log('The API returned an error: ' + err);
        console.log('\nUpdated!\n');
    });
}

function getValues(sheetsV4, spreadsheetId, range) {
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
    console.log('Cannot find cell to update', date, userName);
    return null;
}
