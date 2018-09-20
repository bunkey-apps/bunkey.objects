class ClientPolices {
  async existCliAndObj(ctx, next) {
    const { params: { id, object } } = ctx;
    const client = await Client.getById(id);
    ctx.state.object = await client.getObject(object);
    ctx.state.client = client;
    await next();
  }
}

module.exports = ClientPolices;
