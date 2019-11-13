const getToken = require('./auth');
const writeValue = require('./googleApi');

getToken((token) => {
    writeValue(token, '1c2q8foww7nhmPODR9ehpA7K1OBvpxxei0tCgy-JvBp4', 'Лазутин Евгений', 'да')
});
