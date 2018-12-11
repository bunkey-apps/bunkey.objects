import MongooseModel from 'mongoose-model-class';
import SearchService from 'search-service-mongoose';

class Shared extends MongooseModel {
  schema() {
    return {
      client: { type: MongooseModel.types.ObjectId, ref: 'Client', require: true },
      object: { type: MongooseModel.types.ObjectId, ref: 'ObjectModel', require: true },
      emitterUser: { type: MongooseModel.types.ObjectId, require: true },
      receiverUser: { type: Object, require: true },
      date: { type: Date, default: Date.now },
      webToken: { type: String, unique: true, index: true },
      accessToken: { type: String, unique: true, index: true },
    };
  }

  async beforeSave(doc, next) {
    const {
      client,
      emitterUser,
      object,
      receiverUser,
    } = doc;
    doc.webToken = TokenService.createWebToken();
    const user = { ...receiverUser, role: 'shared' };
    const payload = {
      client,
      emitterUser,
      object,
      user,
    };
    doc.accessToken = TokenService.createToken(payload, '7d');
    next();
  }

  static async validate(webToken) {
    const shared = await this.findOne({ webToken });
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
    fields: 'date,user,object',
    populations: 'object',
  };
}

function buildCriteria({ client, user }) {
  const criteria = {
    user: MongooseModel.adapter.Types.ObjectId(user),
    client: MongooseModel.adapter.Types.ObjectId(client),
  };
  return criteria;
}

module.exports = Shared;
