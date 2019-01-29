module.exports = {
  opts: {
    unknownError: {
      code: 'UserUnknownError',
      description: 'Please contact the API provider for more information.',
      status: 500,
    },
  },
  notFound: {
    status: 404,
    description: 'User not found.',
  },
  InvalidRole: {
    status: 400,
    description: 'Invale role.',
  },
};
