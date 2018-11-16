class ClientPolices {
  async existCliAndObj(ctx, next) {
    const { params: { id, object } } = ctx;
    const client = await Client.getById(id);
    ctx.state.object = await client.getObject(object);
    ctx.state.client = await Client.getById(id);
    await next();
  }

  async existClient(ctx, next) {
    const { params: { id } } = ctx;
    ctx.state.client = await Client.getById(id);
    await next();
  }
}

module.exports = ClientPolices;
