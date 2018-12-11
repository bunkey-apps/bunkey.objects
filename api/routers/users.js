import Router from 'koa-router';

const router = new Router({ prefix: '/users' });
const { apiKey } = AuthPolicies;
const isApigateway = apiKey('apiGateway');
const isUser = apiKey('user');

router.post('/:user/clients/:client/favorites', isUser, ObjectController.createFavorites);
router.get('/:user/clients/:client/favorites', isApigateway, ObjectController.getFavorites);
router.get('/:user/clients/:client/recent', isApigateway, RecentObjectController.get);
router.post('/:user/clients/:client/favorites/:target', isApigateway, ObjectController.addObjectToFavorites);
router.put('/:user/clients/:client/favorites/:target', isApigateway, ObjectController.updateWorkspaceToFavorites);
router.delete('/:user/clients/:client/favorites/:parent', isApigateway, ObjectController.deleteObjectToFavorites);
router.delete('/:user/clients/:client/favorites', isUser, ObjectController.deleteFavorites);

module.exports = router;
