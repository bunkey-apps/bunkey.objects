import MongooseModel from 'mongoose-model-class';
import SearchService from 'search-service-mongoose';

class RecentObject extends MongooseModel {
  schema() {
    return {
      client: { type: MongooseModel.types.ObjectId, ref: 'Client', require: true },
      object: { type: MongooseModel.types.ObjectId, ref: 'ObjectModel', require: true },
      user: { type: MongooseModel.types.ObjectId, require: true },
      date: { type: Date, default: Date.now },
    };
  }

  static async get(query) {
    const criteria = buildCriteria(query);
    const opts = buildOpts(query);
    cano.log.debug('criteria', criteria);
    cano.log.debug('opts', opts);
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
    orderBy: 'date',
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
