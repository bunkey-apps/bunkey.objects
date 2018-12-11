class AuthPolicies {
  apiKey(services = []) {
    const servicesArray = Array.isArray(services) ? services : [services];
    return async (ctx, next) => {
      const cb = async (err, serviceName, invalid) => {
        if (invalid) {
          ctx.status = 401;
          ctx.body = invalid;
          cano.log.error(invalid);
        } else if (err) {
          ctx.status = err.status || 500;
          ctx.body = err;
          cano.log.error(err);
        } else if (servicesArray.length === 0) {
          await next();
        } else if (servicesArray.includes(serviceName)) {
          await next();
        } else {
          const error = { message: 'Invalid access from another service' };
          ctx.status = 403;
          ctx.body = error;
          cano.log.error(error);
        }
      };
      return cano.passport.authenticate('localapikey', cb)(ctx, next);
    };
  }
}

module.exports = AuthPolicies;
