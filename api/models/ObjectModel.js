import MongooseModel from 'mongoose-model-class';
// import SearchService from 'search-service-mongoose';
// import moment from 'moment';
import includes from 'lodash/includes';
import last from 'lodash/last';
import filter from 'lodash/filter';
import pick from 'lodash/pick';

// const modelFields = [
//   'client',
//   // 'guid',
//   'name',
//   'metadata',
//   'type',
//   'children',
//   'parents',
// ];

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
      // guid: { type: String, index: true, require: true },
      name: { type: String, index: true, require: true },
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

  // static get(query) {
  //   const criteria = buildCriteria(query);
  //   const opts = buildOpts(query);
  //   return SearchService.search(this, criteria, opts);
  // }

  static async getById(id) {
    const object = await this.findById(id);
    if (!object) {
      throw new ObjectError('notFound', 'Object not found.');
    }
    return object;
  }

  static async updateById(_id, data) {
    await this.getById(_id);
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

// function buildOpts(query) {
//   const {
//     page = 1,
//     limit = 10,
//     orderBy = '-createdAt',
//     fields = modelFields.join(','),
//   } = query;
//   return {
//     page,
//     limit,
//     orderBy,
//     fields,
//   };
// }

// function buildCriteria({ search, fromDate, toDate }) {
//   const criteria = {};
//   const filterDate = [];
//   if (search) {
//     Object.assign(criteria, { $text: { $search: search } });
//   }
//   if (fromDate) {
//     filterDate.push({
//       createdAt: {
//         $gte: moment(fromDate, 'DD-MM-YYYY').toDate(),
//       },
//     });
//   }
//   if (toDate) {
//     filterDate.push({
//       createdAt: {
//         $lte: moment(toDate, 'DD-MM-YYYY').toDate(),
//       },
//     });
//   }
//   if (filterDate.length > 0) {
//     Object.assign(criteria, { $and: filterDate });
//   }
//   return criteria;
// }

module.exports = ObjectModel;
