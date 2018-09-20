class ClientController {
  async create({ request, response }) {
    const client = await Client.create(request.body);
    response.body = client;
    response.status = 201;
  }

  async updateById({ params, request, response }) {
    await Client.updateById(params.id, request.body);
    response.status = 204;
  }

  async deleteById({ params, response }) {
    await Client.deleteById(params.id);
    response.status = 204;
  }
}

module.exports = ClientController;
