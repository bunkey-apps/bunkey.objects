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
  notUpdateRootObject: {
    status: 400,
    description: 'You can not update the root object.',
  },
  notDeleteRootObject: {
    status: 400,
    description: 'You can not delete the root object.',
  },
  ObjectAlreadyShared: {
    status: 400,
    description: 'The object was already shared with this user.',
  },
  invalidTypeAsParent: {
    status: 400,
    description: 'Parent object is not a folder.',
  },
  WebTokenNotFound: {
    status: 404,
    description: 'Web Token not found.',
  },
  WorkspaceNotFound: {
    status: 404,
    description: 'Workspace not found.',
  },
  MissingFields: {
    status: 400,
    description: 'You doesnt have provided all the fields required for this action.',
  },
};
