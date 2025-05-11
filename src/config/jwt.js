module.exports = {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  };