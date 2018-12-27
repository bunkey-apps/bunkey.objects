import queryString from 'query-string';

const baseUrl = process.env.USER_SERVICE_URL;
const headers = {
  apikey: process.env.USER_APIKEY,
};

class UserService {
  async getByEmail(email) {
    const request = RequestService.create(baseUrl);
    const response = await request.get(`/users?email=${email}`, { headers });
    return response;
  }
  async get(query) {
    const request = RequestService.create(baseUrl);
    const response = await request.get(`/users?${queryString.stringify(query)}`, { headers });
    return response;
  }
  async getById(id) {
    const request = RequestService.create(baseUrl);
    const response = await request.get(`/users/${id}`, { headers });
    return response;
  }
}

export default UserService;
