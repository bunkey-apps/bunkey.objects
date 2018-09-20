module.exports = {
  opts: {
    unknownError: {
      code: 'ClientUnknownError',
      description: 'Please contact the API provider for more information.',
      status: 500,
    },
  },
  notFound: {
    status: 404,
    description: 'Client not found.',
  },
  relatedClient: {
    status: 409,
    description: 'It is not possible to delete the client.',
  },
};
