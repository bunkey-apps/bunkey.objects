module.exports = {
	stores: {
		mongo: {
			connection: { uri: process.env.MONGODB_URI },
			adapter: 'mongoose',
    },
	},
	storeDefault: 'mongo',
};
