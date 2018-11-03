const keygen = key => process.env[key];

module.exports = {
    [keygen('ADMINISTRATION_APIKEY')]: 'administration',
    [keygen('USER_APIKEY')]: 'user',
    [keygen('API_GATEWAY_APIKEY')]: 'apiGateway',
};
