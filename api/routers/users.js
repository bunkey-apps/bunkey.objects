import Router from 'koa-router';

const router = new Router({ prefix: '/users' });
const { apiKey } = AuthPolices;
const isApigateway = apiKey('apiGateway');
const isUser = apiKey('user');

router.post('/:user/clients/:client/workspaces', isUser, ObjectController.createWorkspace);
router.get('/:user/clients/:client/workspaces', isApigateway, ObjectController.getWorkspace);
router.put('/:user/clients/:client/workspaces/objects', isApigateway, ObjectController.addObjectToWorkspace);
router.delete('/:user/clients/:client/workspaces/objects', isApigateway, ObjectController.deleteObjectToWorkspace);
router.delete('/:user/clients/:client/workspaces', isUser, ObjectController.deleteWorkspace);

module.exports = router;
