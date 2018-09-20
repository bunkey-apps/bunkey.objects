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
    description: 'Object not found.',
  },
  invalidType: {
    status: 400,
    description: 'Object type invalid.',
  },
  notDeleteRootObject: {
    status: 400,
    description: 'You can not delete the root object.',
  },
  invalidTypeAsParent: {
    status: 400,
    description: 'Parent object is not a folder.',
  },
};
