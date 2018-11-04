import RequestPromise from 'request-promise-native';

const defaultOptions = {
  resolveWithFullResponse: true,
  json: true,
};

async function startRequest(opts) {
  try {
    const response = await RequestPromise(opts);
    return response;
  } catch (error) {
    if (!error.response) throw error;
    const { body: { code, description, message }, statusCode: status } = error.response;
    if (code && description && status) {
      const msg = message || 'An error occurred in RequestService.';
      throw new CanoError(msg, { code, description, status });
    } else {
      throw error;
    }
  }
}

class RequestWrapper {

  constructor(baseUrl) {
    this.baseUrl = baseUrl
  }

  async get(resource, opts = {}) {
    const method = 'get';
    const uri = this.baseUrl + resource;
    const options = Object.assign({}, defaultOptions, opts, { uri, method });
    const response = await startRequest(options);
    return response;
  }

  async post(resource, body = {}, opts = {}) {
    const method = 'post';
    const uri = this.baseUrl + resource;
    const options = Object.assign({}, defaultOptions, opts, { body, uri, method });
    const response = await startRequest(options);
    return response;
  }

  async put(resource, body = {}, opts = {}) {
    const method = 'put';
    const uri = this.baseUrl + resource;
    const options = Object.assign({}, defaultOptions, opts, { body, uri, method });
    const response = await startRequest(options);
    return response;
  }

  async delete(resource, body = {}, opts = {}) {
    const method = 'delete';
    const uri = this.baseUrl + resource;
    const options = Object.assign({}, defaultOptions, opts, { body, uri, method });
    const response = await startRequest(options);
    return response;
  }

}

module.exports = class RequestService {
  create(baseUrl) {
    return new RequestWrapper(baseUrl);
  }
}
