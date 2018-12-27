import MongooseModel from 'mongoose-model-class';

class User extends MongooseModel {
  schema() {
    return {
      email: {
        type: String,
        required: true,
        unique: true,
      },
      name: {
        type: String,
        required: true,
      },
      avatar: {
        type: String,
      },
      role: {
        type: String,
        required: true,
      },
      status: {
        type: Boolean,
        required: true,
      },
    };
  }
  
  static async getById(id) {
    const user = await this.findById(id);
    if (!user) {
      throw new UserError('UserNotFound', 'User not found.');
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

  static async deleteById(id) {
    await this.getById(id);
    const criteria = {
      _id: id,
    };
    return this.remove(criteria);
  }
}

module.exports = User;
