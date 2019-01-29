import includes from 'lodash/includes';
import filter from 'lodash/filter';

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
    const { user, shared } = query;
    const { object } = state;
    const { children = [] } = object;
    if (user) {
      await RecentObject.set({ client, object: object._id, user });
    } else if (shared) {
      if (!includes(object.sharedExternal, shared)) {
        throw new ObjectError('InsufficientPrivileges', 'External user invalid.');
      } else {
        object.children = filter(children, child => child && includes(child.sharedExternal, shared));
      }
    }    
    response.status = 200;
    response.body = object;
  }

  async getWorkspacesByClient({ params, response }) {
    const { id: client } = params;
    const users = await Workspace.getUsers(client);
    response.status = 200;
    response.body = users;
  }

  async updateWorkspacesByClient({ request: { body }, params, response }) {
    const { id: client } = params;
    cano.log.debug('updateWorkspacesByClient -> body', body);
    const { action, user, role } = body;
    switch (action) {
      case 'updateRol': {
        await Workspace.updateUserRole(client, user, role);
        response.status = 204;
        break;
      }
      default:
        throw new CanoError(`The action ${action} is invalid.`, {
          description: 'Invalid Action for update workspace.',
          status: 400,
          code: 'InvalidAction',
        });
    }
  }

  async getWorkspacesByUser({ params, response }) {
    const { id: user } = params;
    const clients = await Workspace.getClients(user);
    response.status = 200;
    response.body = clients;
  }
  
  async updateById({ state, request, response }) {
    const { object } = state;
    if (request.body.action) {
      switch (request.body.action) {
        case 'move':
          await ObjectModel.move(object.id, request.body.folder);
          break;
        case 'setReadyStatus':
          await ObjectModel.setReadyStatus([object.id]);
          break;
        default:
          throw new ObjectError('InvalidAction', 'Invalid action.');
      }
    } else {
      await ObjectModel.updateById(object.id, request.body);
    }
    response.status = 204;
  }

  async update({ request, response }) {
    switch (request.body.action) {
      // case 'move':
      //   await ObjectModel.move(request.body.objects, request.body.folder);
      //   break;
      case 'setReadyStatus':
        await ObjectModel.setReadyStatus(request.body.objects);
        break;
      default:
        throw new ObjectError('InvalidAction', 'Invalid action.');
    }
    response.status = 204;
  }

  async deleteById({ state, response }) {
    const { object } = state;
    await ObjectModel.deleteById(object.id);
    response.status = 204;
  }

  async createFavorites({ params, response }) {
    const { user, client } = params;
    const u = await User.getById(user);
    const role = u.role === 'operator' ? 'operator' : 'admin';
    await Workspace.create({ user, client, role });
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
