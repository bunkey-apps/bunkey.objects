import { Strategy } from 'passport-localapikey-update';

/**
 * @class ApiKeyStrategy
 * @description This class represents an auth strategy and is responsible of
 * verify the apiKey sended by another microservices or apigateway
 * @author Antonio Mejias
 */

class ApiKeyStrategy extends Strategy {
  constructor() {
    super(ApiKeyStrategy.options(), ApiKeyStrategy.verify);
  }

  /**
   * @method options
   * @description This method is a getter for the options to configure the Strategy
   * @author Antonio Mejias
   */
  static options() {
    return {
      // apiKeyHeader: 'x-api-key',
    };
  }

  /**
   * @method verify
   * @description This method is the responsible of verify the apiKey
   * @param {string} apiKey
   * @author Antonio Mejias
   */
  static verify(apikey, done) {
    if (!cano.app.config.apiKeys[apikey]) {
      return done(new Error(`You have provided an Invalid API Key ${apikey}`, 401));
    }
    return done(null, cano.app.config.apiKeys[apikey]);
  }
}

module.exports = ApiKeyStrategy;
