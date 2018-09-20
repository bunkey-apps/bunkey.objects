const keygen = key => process.env[key];

module.exports = {
    [keygen('API_GATEWAY_APIKEY')]: 'apiGateway',
};
