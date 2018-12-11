import Router from 'koa-router';

const router = new Router({ prefix: '/url-signature' });
const { apiKey } = AuthPolicies;
const isApigateway = apiKey('apiGateway');

router.post('/', isApigateway, PresignedURLController.create);

module.exports = router;
