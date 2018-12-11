import MongooseModel from 'mongoose-model-class';

class Workspace extends MongooseModel {
  schema() {
    const Shared = new MongooseModel.Schema({
      object: { type: MongooseModel.types.ObjectId, ref: 'ObjectModel', require: true },
      user: { type: MongooseModel.types.ObjectId, require: true },
      date: { type: Date, default: Date.now },
    });
    return {
      client: { type: MongooseModel.types.ObjectId, ref: 'Client', require: true },
      user: { type: MongooseModel.types.ObjectId, require: true },
      favorites: { type: MongooseModel.types.ObjectId, ref: 'ObjectModel', index: true },
      shared: { type: [Shared] },
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
