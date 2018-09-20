import includes from 'lodash/includes';

const validTypes = [
  'root',
  'folder',
  'workspace',
];

class ObjectController {
  async create({ request, state, response }) {
    const { object, client } = state;
    const { body } = request;
    body.client = client.id;
    body.parents = [...object.parents, object.id];
    if (!includes(validTypes, object.type)) {
      throw new ObjectError('invalidTypeAsParent', 'Parent object is not a folder.');
    }
    const doc = await ObjectModel.create(body);
    await object.setChildren(doc);
    response.body = doc;
    response.status = 201;
  }

  async getById({ state, response }) {
    response.status = 200;
    response.body = state.object;
  }
  
  async updateById({ state, request, response }) {
    const { object } = state;
    await ObjectModel.updateById(object.id, request.body);
    response.status = 204;
  }

  async deleteById({ state, response }) {
    const { object } = state;
    await ObjectModel.deleteById(object.id);
    response.status = 204;
  }
}

module.exports = ObjectController;
