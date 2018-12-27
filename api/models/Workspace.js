import MongooseModel from 'mongoose-model-class';
import map from 'lodash/map';

class Workspace extends MongooseModel {
  schema() {
    return {
      client: { type: MongooseModel.types.ObjectId, ref: 'Client', require: true },
      user: { type: MongooseModel.types.ObjectId, ref: 'User', require: true },
      favorites: { type: MongooseModel.types.ObjectId, ref: 'ObjectModel', index: true },
    };
  }
  
  /*
   * @todo Verificar que el usuario esté relacionado con el cliente.
   */
  async beforeSave(doc, next) {
    const { client, user } = doc;
    const favorites = await ObjectModel.create({
      client,
      name: 'home',
      type: 'workspace',
      user,
    });
    doc.favorites = favorites.id;
    next();
  }

  static async getUsers(client) {
    const wss = await this.find({ client })
      .populate('user', 'name email avatar role')
      .exec();
    return map(wss, w => w.user);
  }

  static async getClients(user) {
    const wss = await this.find({ user })
      .populate('client', 'acountSetting name root')
      .exec();
    return map(wss, w => w.client);
  }

  static async verifyAccess(user, client) {
    const workspace = await this.findOne({ user, client });
    if (!workspace) {
      throw new ObjectError('AccessDeniedObject', 'Access denied to the object.');
    }
    return workspace;
  }

  static async getByUserIdAndClientId(user, client) {
    const workspace = await this.findOne({ user, client });
    if (!workspace) {
      throw new ObjectError('WorkspaceNotFound');
    }
    return workspace;
  }

  static async delete(user, client) {
    await this.getByUserIdAndClientId(user, client);
    return this.remove({ user, client });
  }

  async addObject(target, type, value) {
    const { user, client } = this;
    const parent = await ObjectModel.findOne({ _id: target, client, user });
    if (!parent) {
      throw new ObjectError('notFound', 'Parent object not found.');
    }
    if (parent.type !== 'workspace') {
      throw new ObjectError('invalidTypeAsParent', 'The parent is not a workspace.');
    }
    if (type === 'workspace') {
      await createWorkspace(parent, user, value);
      return true;
    }
    const object = await ObjectModel.findOne({ _id: value, client });
    if (!object) {
      throw new ObjectError('notFound', 'Object to add not found.');
    }
    await parent.setChildren(object);
  }

  async updateObject(_target, data) {
    const { user, client } = this;
    const { name } = data;
    const criteria = {
      _id: _target,
      client,
      user,
      type: 'workspace',
    };
    const target = await ObjectModel.findOne(criteria);
    if (!target) {
      throw new ObjectError('notFound', 'Parent object not found.');
    }
    await ObjectModel.updateOne({ _id: target.id }, { $set: { name } });
  }
  
  async deleteObject(_parent, _target) {
    const { user, client } = this;
    const parent = await ObjectModel.findOne({ _id: _parent, client, user });
    if (!parent) {
      throw new ObjectError('notFound', 'Parent object not found.');
    }
    const target = await ObjectModel.findOne({ _id: _target, client });
    if (!target) {
      throw new ObjectError('notFound', 'Target object not found.');
    }
    if (target.type === 'workspace') {
      await ObjectModel.deleteById(target.id);      
    } else {
      await parent.removeChildren(target);
    }
  }

  config(schema) {
    schema.index({ '$**': 'text' });
  }
}

async function createWorkspace(target, user, name) {
  const body = {
    client: target.client,
    name,
    parents: [...target.parents, target.id],
    type: 'workspace',
    user,
  };
  const doc = await ObjectModel.create(body);
  await target.setChildren(doc);
}

module.exports = Workspace;
