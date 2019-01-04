import MongooseModel from 'mongoose-model-class';

class AutoTags extends MongooseModel {
  schema() {
    return {
      uuid: { type: String, required: true, unique: true },
      jobId: { type: String },
      result: { type: [String] },
      object: { type: MongooseModel.types.ObjectId, ref: 'ObjectModel' },
      ready: { type: Boolean, default: false },
    };
  }

  async afterSave(doc, next) {
    const { uuid, result, ready } = doc;
    const object = await ObjectModel.findOne({ uuid });
    cano.log.debug('afterSave', JSON.stringify(object));
    if (object && ready) {
      await object.setAutoTags(result);
    }
    next();
  }

  setResult(result) {
    this.result = result;
    this.ready = true;
    return this.save();
  }
  
  static async getById(id) {
    const user = await this.findById(id);
    if (!user) {
      throw new CanoError('AutoTags not found.', {
        code: 'AutoTagsNotFound',
        description: `AutoTags document ${id} not found.`,
        status: 404,
      });
    }
    return user;
  }

  static async updateById(id, data) {
    await this.getById(id);
    const criteria = {
      _id: id,
    };
    return this.update(criteria, {
      $set: data,
    });
  }
}

module.exports = AutoTags;
