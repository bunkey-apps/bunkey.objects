import MongooseModel from 'mongoose-model-class';

class Client extends MongooseModel {
  schema() {
    const AcountSetting = new MongooseModel.Schema({
      logo: { type: String },
      background: { type: String },
      language: { type: String },
    }, { _id: false });
    return {
      name: { type: String, index: true, require: true },
      acountSetting: { type: AcountSetting, default: {} },
      root: { type: MongooseModel.types.ObjectId, ref: 'ObjectModel', index: true },
    };
  }

  async beforeSave(doc, next) {
    try {
      const root = await ObjectModel.create({
        client: doc._id,
        name: 'home',
        type: 'root',
      });
      doc.root = root._id;
      next();
    } catch (error) {
      next(error);
    }
  }

  async getObject(_id) {
    const criteria = { _id, client: this.id };
    const object = await ObjectModel
      .findOne(criteria)
      .populate('client')
      .populate('children')
      .populate('parents')
      .exec();
    if (!object) {
      throw new ObjectError('notFound', 'Object not found.');
    }
    return object;
  }

  static async getById(id) {
    const client = await this.findById(id);
    if (!client) {
      throw new ClientError('notFound', 'Client not found.');
    }
    return client;
  }

  static async updateById(_id, data) {
    await this.getById(_id);
    return this.update({ _id }, { $set: data });
  }

  static async deleteById(_id) {
    await this.getById(_id);
    await ObjectModel.remove({ client: _id });
    return this.remove({ _id });
  }

  config(schema) {
    schema.index({ '$**': 'text' });
  }
}

module.exports = Client;
