import Router from 'koa-router';

const { apiKey } = AuthPolicies;

const router = new Router({ prefix: '/shared' });
const isApigateway = apiKey('apiGateway');

router
      .post('/', isApigateway, SharedController.create)
      .delete('/', isApigateway, SharedController.revoke)
      .post('/validate', isApigateway, SharedController.validate);

module.exports = router;
