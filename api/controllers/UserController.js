class UserController {
  async create({ request, response }) {
    const user = await User.create(request.body);
    response.body = user;
    response.status = 201;
  }

  async updateById({ params, request, response }) {
    await User.updateById(params.id, request.body);
    response.status = 204;
  }

  async deleteById({ params, response }) {
    await User.deleteById(params.id);
    await Workspace.deleteMany({ user: params.id });
    response.status = 204;
  }
}

module.exports = UserController;
