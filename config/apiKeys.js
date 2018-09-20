const keygen = key => process.env[key];

module.exports = {
    [keygen('ADMINISTRATION_APIKEY')]: 'administration',
    [keygen('API_GATEWAY_APIKEY')]: 'apiGateway',
};
