import Router from 'koa-router';

const router = new Router({ prefix: '/users' });
const { apiKey } = AuthPolicies;
const isApigateway = apiKey('apiGateway');
const isUser = apiKey('user');

router.post('/', isUser, UserController.create)
      .put('/:id', isUser, UserController.updateById)
      .delete('/:id', isUser, UserController.deleteById)
      .get('/:id/workspaces', isApigateway, ObjectController.getWorkspacesByUser)

      .post('/:user/clients/:client/favorites', isUser, ObjectController.createFavorites)
      .get('/:user/clients/:client/favorites', isApigateway, ObjectController.getFavorites)
      .get('/:user/clients/:client/recent', isApigateway, RecentObjectController.get)
      .get('/:user/clients/:client/shared', isApigateway, SharedController.get)
      .post('/:user/clients/:client/favorites/:target', isApigateway, ObjectController.addObjectToFavorites)
      .put('/:user/clients/:client/favorites/:target', isApigateway, ObjectController.updateWorkspaceToFavorites)
      .delete('/:user/clients/:client/favorites/:parent', isApigateway, ObjectController.deleteObjectToFavorites)
      .delete('/:user/clients/:client/favorites', isUser, ObjectController.deleteFavorites);

module.exports = router;
