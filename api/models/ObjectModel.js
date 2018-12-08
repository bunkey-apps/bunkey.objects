import MongooseModel from 'mongoose-model-class';
import SearchService from 'search-service-mongoose';
import includes from 'lodash/includes';
import last from 'lodash/last';
import pick from 'lodash/pick';

const OBJECT_TYPES = [
  'root',
  'folder',
  'workspace',
  'image',
  'video',
  'document',
];

const copyRightTypes = [
  'free',
  'limited',
  'own',
];

class ObjectModel extends MongooseModel {
  schema() {
    const MetaData = new MongooseModel.Schema({
      descriptiveTags: { type: [String], default: [] },
      audiovisualTags: { type: [String], default: [] },
      copyRight: { type: String, enum: copyRightTypes },
      licenseFile: { type: String },
      createdDate: { type: Date },
    });
    return {
      client: { type: MongooseModel.types.ObjectId, ref: 'Client', require: true },
      user: { type: MongooseModel.types.ObjectId },
      guid: { type: String, index: true },
      name: { type: String, index: true, require: true },
      originalURL: { type: String, index: true },
      metadata: { type: MetaData, default: {} },
      type: {
        type: String, index: true, require: true, enum: OBJECT_TYPES,
      },
      children: { type: [{ type: MongooseModel.types.ObjectId, ref: 'ObjectModel' }], index: true, default: [] },
      parents: { type: [{ type: MongooseModel.types.ObjectId, ref: 'ObjectModel' }], index: true, default: [] },
    };
  }

  async beforeSave(doc, next) {
    try {
      if (doc.type === 'workspace' && !doc.user) {
        throw new ObjectError('MissingFields', 'User not specified.');
      }
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
      const parentLast = last(doc.parents);
      if (parentLast) {
        const parent = await doc.model('ObjectModel').findById(parentLast);
        if (parent.type === 'workspace' && doc.type !== 'workspace') {
          throw new ObjectError('invalidTypeAsParent', 'can\'t create object into workspace.');
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
    const { _id } = this;
    return this.model('ObjectModel').update({ _id }, { $addToSet: { children: object.id } });
  }

  removeChildren(object) {
    const { _id } = this;
    return this.model('ObjectModel').update({ _id }, { $pull: { children: object.id } });
  }

  static async get(query) {
    cano.log.debug('get -> query', query);
    const criteria = buildCriteria(query);
    const opts = buildOpts(query);
    return SearchService.search(this, criteria, opts);
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

function buildOpts(query) {
  const {
    page = 1,
    limit = 10,
    orderBy = '-createdAt',
    fields = null,
  } = query;
  return {
    page,
    limit,
    orderBy,
    fields,
  };
}

function buildCriteria({ client, search, tag, type }) {
  const criteria = {
    client: MongooseModel.adapter.Types.ObjectId(client),
    type: { $nin: ['root', 'workspace'] },
  };
  if (search) {
    Object.assign(criteria, { $text: { $search: search } });
  }
  if (type) {
    Object.assign(criteria, { type });
  }
  if (tag) {
    Object.assign(criteria, { 'metadata.tags': { $regex: `.*${tag}.*` } });
  }
  return criteria;
}

module.exports = ObjectModel;
