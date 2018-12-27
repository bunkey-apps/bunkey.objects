import MongooseModel from 'mongoose-model-class';
import SearchService from 'search-service-mongoose';

class RecentObject extends MongooseModel {
  schema() {
    return {
      client: { type: MongooseModel.types.ObjectId, ref: 'Client', require: true },
      object: { type: MongooseModel.types.ObjectId, ref: 'ObjectModel', require: true },
      user: { type: MongooseModel.types.ObjectId, ref: 'User', require: true },
      date: { type: Date, default: Date.now },
    };
  }

  static get(query) {
    const criteria = buildCriteria(query);
    const opts = buildOpts(query);
    return SearchService.search(this, criteria, opts);
  }

  static set({ client, object, user }) {
    const critera = { client, object, user };
    return this.updateOne(critera, { $set: { date: new Date() } }, { upsert: true });
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

module.exports = RecentObject;
