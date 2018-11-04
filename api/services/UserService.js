const baseUrl = process.env.ADMIN_SERVICE_URL;
const headers = {
  apikey: process.env.ADMIN_APIKEY,
};

class UserService {
    async isHasPermission(user, client) {
      try {
        const request = RequestService.create(baseUrl);
        const response = await request.get(`/clients/${id}`, { headers });
        return response;
      } catch (error) {
        if (error.status === 401) {
          return false;
        }
        throw error;
      }
    }
}

export default UserService;
