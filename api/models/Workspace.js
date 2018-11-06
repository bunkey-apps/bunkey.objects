import MongooseModel from 'mongoose-model-class';

class Workspace extends MongooseModel {
  schema() {
    return {
      client: { type: MongooseModel.types.ObjectId, ref: 'Client', require: true },
      user: { type: MongooseModel.types.ObjectId, require: true },
      objects: { type: [{ type: MongooseModel.types.ObjectId, ref: 'ObjectModel' }] },
      favorites: { type: [{ type: MongooseModel.types.ObjectId, ref: 'ObjectModel' }] },
    };
  }
  // @TODO Verificar que el usuario esté relacionado con el cliente.
  // async beforeSave(doc, next) {
  //   try {
  //     const { client, user } = doc;
  //     await UserService.isHasPermission(user, client);
  //     next();
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  static async getByUserIdAndClientId(user, client) {
    const workspace = await this.findOne({ user, client })
      .populate('objects')
      .populate('favorites')
      .exec();
    if (!workspace) {
      throw new ObjectError('WorkspaceNotFound');
    }
    return workspace;
  }

  static async delete(user, client) {
    await this.getByUserIdAndClientId(user, client);
    return this.remove({ user, client });
  }

  static async addObject(target, user, client, object) {
    await this.getByUserIdAndClientId(user, client);
    const criteria = { user, client };
    const data = {};
    if (target === 'favorites') {
      data.favorites = object;
    } else {
      data.objects = object;
    }
    return this.updateOne(criteria, { $addToSet: data });
  }
  
  static async deleteObject(target, user, client, object) {
    await this.getByUserIdAndClientId(user, client);
    const criteria = { user, client };
    const data = {};
    if (target === 'favorites') {
      data.favorites = object;
    } else {
      data.objects = object;
    }
    return this.updateOne(criteria, { $pull: data });
  }

  config(schema) {
    schema.index({ '$**': 'text' });
  }
}

module.exports = Workspace;
