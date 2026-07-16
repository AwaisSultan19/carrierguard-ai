const { createClerkClient } = require('@clerk/backend');

let clerkClient = null;

function getClerkClient() {
  if (!clerkClient && process.env.CLERK_SECRET_KEY) {
    clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  }
  return clerkClient;
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (process.env.NODE_ENV === 'development') {
      req.userId = 'dev_user';
      return next();
    }
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const client = getClerkClient();
  if (!client) {
    req.userId = 'dev_user';
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const { userId } = await client.verifyToken(token);
    req.userId = userId;
    next();
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      req.userId = 'dev_user';
      return next();
    }
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };
