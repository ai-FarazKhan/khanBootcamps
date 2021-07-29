const NodeGeocoder = require('node-geocoder');

const options = {
    // provider aur api key jaisa ke pata hai maine config.env file main mention ki wi hai, toh wahan se laingain.

    provider: process.env.GEOCODER_PROVIDER,
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null // we dont want to formate thats why its null.

}

const geocoder = NodeGeocoder(options);

module.exports = geocoder;