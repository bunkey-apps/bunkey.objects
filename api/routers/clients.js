import Router from 'koa-router';

const router = new Router({ prefix: '/clients' });
const { existCliAndObj, existClient } = ClientPolices;
const { apiKey } = AuthPolicies;
const isApigateway = apiKey('apiGateway');
const isAdministration = apiKey('administration');

router.post('/', isAdministration, ClientController.create);
router.put('/:id', isAdministration, ClientController.updateById);
router.delete('/:id', isAdministration, ClientController.deleteById);

router.get('/:id/workspaces/:user', isApigateway, existClient, ObjectController.getWorkspace);
router.get('/:id/workspaces', isApigateway, existClient, ObjectController.getWorkspacesByClient);
router.put('/:id/workspaces', isApigateway, existClient, ObjectController.updateWorkspacesByClient);
router.get('/:id/objects', isApigateway, existClient, ObjectController.get);
router.put('/:id/objects', isApigateway, existClient, ObjectController.update);
router.post('/:id/objects/:object', isApigateway, existCliAndObj, ObjectController.create);
router.get('/:id/objects/:object', isApigateway, existCliAndObj, ObjectController.getById);
router.put('/:id/objects/:object', isApigateway, existCliAndObj, ObjectController.updateById);
router.delete('/:id/objects/:object', isApigateway, existCliAndObj, ObjectController.deleteById);

module.exports = router;
