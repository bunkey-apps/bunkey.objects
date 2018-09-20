import Router from 'koa-router';

const router = new Router({ prefix: '/clients' });
const { ClientController, ObjectController } = cano.app.controllers;
const { AuthPolices: { apiKey }, ClientPolices: { existCliAndObj } } = cano.app.policies;
const isApigateway = apiKey('apiGateway');

router.post('/', isApigateway, ClientController.create);
router.put('/:id', isApigateway, ClientController.updateById);
router.delete('/:id', isApigateway, ClientController.deleteById);

router.post('/:id/objects/:object', isApigateway, existCliAndObj, ObjectController.create);
router.get('/:id/objects/:object', isApigateway, existCliAndObj, ObjectController.getById);
router.put('/:id/objects/:object', isApigateway, existCliAndObj, ObjectController.updateById);
router.delete('/:id/objects/:object', isApigateway, existCliAndObj, ObjectController.deleteById);

module.exports = router;
