import includes from 'lodash/includes';

const validTypes = [
  'root',
  'folder',
  'workspace',
];

class ObjectController {
  async create({ request, state, response }) {
    const { object, client } = state;
    const { body } = request;
    body.client = client.id;
    body.parents = [...object.parents, object.id];
    if (!includes(validTypes, object.type)) {
      throw new ObjectError('invalidTypeAsParent', 'Parent object is not a folder.');
    }
    const doc = await ObjectModel.create(body);
    await object.setChildren(doc);
    response.body = doc;
    response.status = 201;
  }

  async get({ query, state, response }) {
    const { client } = state;
    const { collection, pagination } = await ObjectModel.get({ ...query, client: client.id });
    response.set('X-Pagination-Total-Count', pagination['X-Pagination-Total-Count']);
    response.set('X-Pagination-Limit', pagination['X-Pagination-Limit']);
    response.status = 200;
    response.body = collection;
  }

  async getById({ params, query, state, response }) {
    const { id: client } = params;
    const { user } = query;
    if (user) {
      const { _id: object } = state.object;
      const criteria = { client, object, user };
      await RecentObject.updateOne(criteria, { $set: { date: new Date() } }, { upsert: true });
    }
    response.status = 200;
    response.body = state.object;
  }
  
  async updateById({ state, request, response }) {
    const { object } = state;
    await ObjectModel.updateById(object.id, request.body);
    response.status = 204;
  }

  async deleteById({ state, response }) {
    const { object } = state;
    await ObjectModel.deleteById(object.id);
    response.status = 204;
  }

  async createFavorites({ params, response }) {
    const { user, client } = params;
    await Workspace.create({ user, client });
    response.status = 204;
  }

  async getFavorites({ params, response }) {
    const { user, client } = params;
    let workspace = await Workspace.findOne({ user, client });
    if (!workspace) {
      await Workspace.create({ user, client });
    }
    workspace = await Workspace.getByUserIdAndClientId(user, client);
    const cli = await Client.getById(workspace.client);
    response.body = await cli.getObject(workspace.favorites);
    response.status = 200;
  }

  async addObjectToFavorites({ request, params, response }) {
    const { user, client, target } = params;
    const { body: { name, object } } = request;
    let workspace = await Workspace.findOne({ user, client });
    if (!workspace) {
      workspace = await Workspace.create({ user, client });
    }
    // Create Workspace Folder
    if (name) {
      await workspace.addObject(target, 'workspace', name);
    }
    // Add Object 
    if (object) {
      await workspace.addObject(target, 'object', object);
    }
    response.status = 204;
  }

  async updateWorkspaceToFavorites({ request, params, response }) {
    const { user, client, target } = params;
    const { body } = request;
    let workspace = await Workspace.findOne({ user, client });
    if (!workspace) {
      workspace = await Workspace.create({ user, client });
    }
    await workspace.updateObject(target, body);
    response.status = 204;
  }

  async deleteObjectToFavorites({ request, params, response }) {
    const { user, client, parent } = params;
    const { body: { target } } = request;
    let workspace = await Workspace.findOne({ user, client });
    if (!workspace) {
      workspace = await Workspace.create({ user, client });
    }
    await workspace.deleteObject(parent, target);
    response.status = 204;
  }

  async deleteFavorites({ params, response }) {
    const { user, client } = params;
    await Workspace.delete(user, client);
    response.status = 204;
  }
}

module.exports = ObjectController;
