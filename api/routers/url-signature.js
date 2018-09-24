import Router from 'koa-router';

const router = new Router({ prefix: '/url-signature' });
const { PresignedURLController } = cano.app.controllers;
const { AuthPolices: { apiKey } } = cano.app.policies;
const isApigateway = apiKey('apiGateway');

router.post('/', isApigateway, PresignedURLController.create);

module.exports = router;
