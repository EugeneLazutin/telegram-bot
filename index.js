const fs = require('fs');
const Telegraf = require('telegraf');
const {getCredentials, authorize} = require('./auth');
const writeValue = require('./googleApi');

function start(token) {
    console.log('bot token - ', token);
    const bot = new Telegraf(token);

    bot.start((ctx) => ctx.reply('Welcome'));
    bot.help((ctx) => ctx.reply('Send me a sticker'));
    bot.on('sticker', (ctx) => ctx.reply('👍'));
    bot.hears('hi', (ctx) => ctx.reply('Hey there'));

    return bot.launch();
}

if(process.env.bot_token) {
    start(process.env.bot_token);
} else {
    fs.readFile('bot_token.json', 'utf8', (err, content) => {
        if (err) return console.log('Error loading bot token file:', err);
        start(content);
    });
}

// getCredentials().then(authorize).then((token) => {
//     writeValue(token, '1c2q8foww7nhmPODR9ehpA7K1OBvpxxei0tCgy-JvBp4', 'Лазутин Евгений', 'да');
// });
