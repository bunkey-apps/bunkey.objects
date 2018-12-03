class RecentObjectController {
  async get({ query, params: { client, user }, response }) {
    const { collection, pagination } = await RecentObject.get({ ...query, client, user });
    response.set('X-Pagination-Total-Count', pagination['X-Pagination-Total-Count']);
    response.set('X-Pagination-Limit', pagination['X-Pagination-Limit']);
    response.status = 200;
    response.body = collection;
  }
}

module.exports = RecentObjectController;
