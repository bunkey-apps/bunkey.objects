import MongooseModel from 'mongoose-model-class';
import SearchService from 'search-service-mongoose';
import moment from 'moment';

class Shared extends MongooseModel {
  schema() {
    return {
      client: { type: MongooseModel.types.ObjectId, ref: 'Client', require: true },
      object: { type: MongooseModel.types.ObjectId, ref: 'ObjectModel', require: true },
      emitterUser: { type: MongooseModel.types.ObjectId, require: true },
      receiverUser: { type: String, require: true },
      webToken: { type: String, unique: true, index: true },
      // accessToken: { type: String, unique: true, index: true },
      expires: { type: Date },
      isPublic: { type: Boolean, require: true },
      status: { type: Boolean, default: true },
    };
  }

  async beforeSave(doc, next) {
    doc.webToken = TokenService.createWebToken();
    doc.expires = moment().add(7, 'days').toDate();
    next();
  }

  static async validate(webToken) {
    const criteria = { webToken, status: true, expires: { $gte: new Date() } };
    const shared = await this.findOne(criteria)
      .populate('object', 'name originalURL metadata type')
      .populate('client', 'name')
      .exec();
    if (!shared) {
      throw new ObjectError('WebTokenNotFound');
    }
    return shared;
  }

  static async get(query) {
    const criteria = buildCriteria(query);
    const opts = buildOpts(query);
    return SearchService.search(this, criteria, opts);
  }
}

function buildOpts(query) {
  const {
    page = 1,
    limit = 10,
  } = query;
  return {
    page,
    limit,
    orderBy: '-date',
    fields: 'client,object,emitterUser,receiverUser',
    populations: 'client object',
  };
}

function buildCriteria({ client, receiverUser, status }) {
  const criteria = {
    $and: [
      { client: MongooseModel.adapter.Types.ObjectId(client) },
      { 
        $or: [
          { receiverUser: receiverUser[0] },
          { receiverUser: receiverUser[1] },
        ],
      },
      { status },
    ],
  };
  return criteria;
}

module.exports = Shared;
