import MongooseModel from 'mongoose-model-class';
import includes from 'lodash/includes';
import last from 'lodash/last';
import filter from 'lodash/filter';
import pick from 'lodash/pick';

const OBJECT_TYPES = [
  'root',
  'folder',
  'workspace',
  'image',
  'video',
  'document',
];

class ObjectModel extends MongooseModel {
  schema() {
    return {
      client: { type: MongooseModel.types.ObjectId, ref: 'Client', require: true },
      guid: { type: String, index: true },
      name: { type: String, index: true, require: true },
      originalURL: { type: String, index: true },
      metadata: { type: Object, index: true, default: {} },
      type: { type: String, index: true, require: true, enum: OBJECT_TYPES },
      children: { type: [{ type: MongooseModel.types.ObjectId, ref: 'ObjectModel' }], index: true, default: [] },
      parents: { type: [{ type: MongooseModel.types.ObjectId, ref: 'ObjectModel' }], index: true, default: [] },
    };
  }

  async beforeSave(doc, next) {
    try {
      const obj = await doc.model('ObjectModel').findOne({ client: doc.client, type: 'root' });
      if (obj) {
        const validTypes = [
          'folder',
          'workspace',
          'image',
          'video',
        ];
        if (!includes(validTypes, doc.type)) {
          throw new ObjectError('invalidType', 'Object type invalid.');
        }
      }
      if (includes(['image', 'video'], doc.type)) {
        if (!doc.guid || !doc.originalURL) {
          const fields = [];
          if (!doc.guid) {
            fields.push('guid');
          }
          if (!doc.originalURL) {
            fields.push('originalURL');
          }
          const message = `Field unspecified: ${fields.join(',')}`;
          throw new ObjectError('MissingFields', message);
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  }

  setChildren(object) {
    const { _id, children } = this;
    const data = { children: [...children, object.id] };
    return this.model('ObjectModel').update({ _id }, { $set: data });
  }

  removeChildren(object) {
    const { _id, children } = this;
    const data = { children: filter(children, o => o !== object.id) };
    return this.model('ObjectModel').update({ _id }, { $set: data });
  }

  static async getById(id) {
    const object = await this.findById(id);
    if (!object) {
      throw new ObjectError('notFound', 'Object not found.');
    }
    return object;
  }

  static async updateById(_id, data) {
    const object = await this.getById(_id);
    if (object.type === 'root') {
      throw new ObjectError('notUpdateRootObject', 'Object not found.');
    }
    return this.update({ _id }, { $set: pick(data, ['name', 'metadata']) });
  }

  static async deleteById(_id) {
    const object = await this.getById(_id);
    if (object.type === 'root') {
      throw new ObjectError('notDeleteRootObject', 'You can not delete the root object.');
    }
    const parent = await this.getById(last(object.parents));
    await parent.removeChildren(object);
    return this.remove({ _id });
  }

  config(schema) {
    schema.index({ '$**': 'text' });
  }

  options() {
    return { timestamps: true, collection: 'documents' };
  }
}

module.exports = ObjectModel;
