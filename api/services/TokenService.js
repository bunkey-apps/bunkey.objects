import jwt from 'jsonwebtoken';
import randtoken from 'rand-token';

class TokenService {
  createRefreshToken() {
    return randtoken.uid(256);
  }

  createToken(payload, expiresIn = '3d') {
    return jwt.sign(payload, process.env.JWT_TOKEN_SECRET, { expiresIn });
  }

  createWebToken(size = 256) {
    return randtoken.uid(size);
  }

  generateWebURL(purpose, webToken) {
    switch (purpose) {
      case 'shared':
        return `${process.env.SHARED_URL}?webToken=${webToken}`;
      default:
    }
  }
}

module.exports = TokenService;
