import MongooseModel from 'mongoose-model-class';
import SearchService from 'search-service-mongoose';
import includes from 'lodash/includes';
import filter from 'lodash/filter';
import map from 'lodash/map';
import last from 'lodash/last';
import pick from 'lodash/pick';
import split from 'lodash/split';
import moment from 'moment';

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
      type: { type: String, enum: ['final', 'row'] },
    }, { _id: false });
    return {
      client: { type: MongooseModel.types.ObjectId, ref: 'Client', require: true },
      user: { type: MongooseModel.types.ObjectId, ref: 'User', require: true },
      uuid: { type: String, index: true },
      name: { type: String, index: true, require: true },
      originalURL: { type: String, index: true, require: true },
      mediaQualityURL: { type: String, index: true },
      lowQualityURL: { type: String, index: true },
      metadata: { type: MetaData, default: {} },
      type: {
        type: String, index: true, require: true, enum: OBJECT_TYPES,
      },
      autoTaggingReady: { type: Boolean, default: false },
      sharedExternal: { type: [{ type: String }], default: [], index: true },
      children: { type: [{ type: MongooseModel.types.ObjectId, ref: 'ObjectModel' }], index: true, default: [] },
      parents: { type: [{ type: MongooseModel.types.ObjectId, ref: 'ObjectModel' }], index: true, default: [] },
      status: { type: String, enum: ['pending', 'ready'] },
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
          'document',
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
      if (includes(['image', 'video', 'document'], doc.type)) {
        if (!doc.uuid || !doc.originalURL) {
          const fields = [];
          if (!doc.uuid) {
            fields.push('uuid');
          }
          if (!doc.originalURL) {
            fields.push('originalURL');
          }
          const message = `Field unspecified: ${fields.join(',')}`;
          throw new ObjectError('MissingFields', message);
        }
        doc.mediaQualityURL = doc.originalURL;
        doc.lowQualityURL = doc.originalURL;
        doc.status = 'pending';
      } else {
        doc.status = 'ready';
      }
      next();
    } catch (error) {
      next(error);
    }
  }

  async afterSave(doc, next) {
    const { uuid } = doc;
    const autoTags = await AutoTags.findOne({ uuid });
    if (autoTags && autoTags.ready) {
      await doc.setAutoTags(autoTags.result);
    }
    next();
  }

  setAutoTags(tags) {
    const { _id } = this;
    return this.model('ObjectModel').updateOne({ _id }, {
      $addToSet: { 'metadata.descriptiveTags': { $each: tags } },
      $set: { autoTaggingReady: true },
    });
  }

  setChildren(object) {
    const { _id } = this;
    return this.model('ObjectModel').updateOne({ _id }, { $addToSet: { children: object.id } });
  }

  removeChildren(object) {
    const { _id } = this;
    return this.model('ObjectModel').updateOne({ _id }, { $pull: { children: object.id } });
  }

  setSharedExternal(email) {
    const { _id } = this;
    return this.model('ObjectModel').updateOne({ _id }, { $addToSet: { sharedExternal: email } });
  }

  removeSharedExternal(email) {
    const { _id } = this;
    return this.model('ObjectModel').updateOne({ _id }, { $pull: { sharedExternal: email } });
  }

  static async get(query) {
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
    return this.updateOne({ _id }, { $set: pick(data, ['name', 'metadata']) });
  }

  static async deleteById(_id) {
    const object = await this.getById(_id);
    if (object.type === 'root') {
      throw new ObjectError('notDeleteRootObject', 'You can not delete the root object.');
    }
    const parent = await this.getById(last(object.parents));
    await parent.removeChildren(object);
    await RecentObject.deleteMany({ object: object.id });
    await Shared.deleteMany({ object: object.id });
    if (object.type === 'folder') {
      await deleteChildren(object.children);
    } else {
      await deleteObjectInS3(object);
    }
    await deleteToFavorite(object.client, object.id);
    return this.deleteOne({ _id });
  }

  static async move(objectId, folderId) {
    const object = await this.findById(objectId);
    const parentLast = last(object.parents);
    const oldParent = await this.findById(parentLast);
    const newParent = await this.findById(folderId);
    if (!includes(['folder', 'root', 'workspace'], newParent.type)) {
      throw new ObjectError('ObjectTargetIsNotFolder', 'Object target is not a folder.');
    }
    if (String(newParent.client) !== String(object.client)) {
      throw new ObjectError('FolderIsNotFromClient', 'Folder is not from the object\'s client.');
    }
    await oldParent.removeChildren(object);
    await newParent.setChildren(object);
    await this.updateOne({ _id: object.id }, { $set: { parents: [...newParent.parents, newParent.id] } });
  }

  static async setReadyStatus(objectIds) {
    return this.updateMany({ _id: { $in: objectIds } }, { $set: { status: 'ready' } });
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
    all = false,
  } = query;
  return {
    page,
    limit,
    orderBy,
    fields,
    all,
  };
}

function buildCriteria(query) {
  const {
    client,
    search,
    status,
    tag,
    type,
    metadataType,
    fromDate,
    toDate,
  } = query;
  const filterDate = [];
  const criteria = {
    client: MongooseModel.adapter.Types.ObjectId(client),
    type: { $nin: ['root', 'workspace'] },
  };
  if (search) {
    Object.assign(criteria, {
      $or: [
        { $text: { $search: search } }, { name: { $regex: `.*${search}.*`, $options: 'i' } },
      ],
    });
  }
  if (status) {
    if (status === 'pending') {
      Object.assign(criteria, { status, autoTaggingReady: true });
    } else {
      Object.assign(criteria, { status });
    }
  }
  if (metadataType) {
    Object.assign(criteria, { 'metadata.type': metadataType });
  }
  if (tag) {
    Object.assign(criteria, {
      $or: [
        { 'metadata.descriptiveTags': { $regex: `.*${tag}.*` } },
        { 'metadata.audiovisualTags': { $regex: `.*${tag}.*` } },
      ],
    });
  }
  if (type) {
    Object.assign(criteria, { type });
  }
  if (fromDate) {
    filterDate.push({
      createdAt: {
        $gte: moment(fromDate, 'DD-MM-YYYY').toDate(),
      },
    });
  }
  if (toDate) {
    filterDate.push({
      createdAt: {
        $lte: moment(toDate, 'DD-MM-YYYY').toDate(),
      },
    });
  }
  if (filterDate.length > 0) {
    Object.assign(criteria, { $and: filterDate });
  }
  return criteria;
}

function deleteObjectInS3(object) {
  const {
    originalURL,
    mediaQualityURL,
    lowQualityURL,
  } = object;
  const bucketName = S3Service.getBucketName();
  const promises = [];
  promises.push(S3Service.deleteObject(last(split(originalURL, bucketName)).substring(1)));
  promises.push(S3Service.deleteObject(last(split(mediaQualityURL, bucketName)).substring(1)));
  promises.push(S3Service.deleteObject(last(split(lowQualityURL, bucketName)).substring(1)));
  return Promise.all(promises);
}

function deleteChildren(children) {
  const chi = filter(children, c => c.type !== 'folder');
  return Promise.all(map(chi, c => cano.app.models.ObjectModel.deleteById(c._id)));
}

async function deleteToFavorite(client, object) {
  const workspaces = await Workspace.find({ client });
  return Promise.all(map(workspaces, ws => ws.deleteObject(ws.favorites, object))); 
}

module.exports = ObjectModel;
