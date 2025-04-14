import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;


// isAdmin middleware to protect actions that should only be executed by an admin
export function isAdmin(req, res, next) {
  const token = req.cookies ? req.cookies.access_token : undefined;
  console.log(req.cookies.access_token);

  if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No access token provided' });
  }

  try {
      const decoded = jwt.verify(token, SECRET);
      console.log(decoded);

      if (decoded.role !== 'admin') {
          return res.status(403).json({ error: 'You\'re not an admin.' });
      }
      next();
  } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
          return res.status(401).json({ error: 'Unauthorized - Invalid access token' });
      } else {
          console.error('Error verifying access token:', error);
          return res.status(500).json({ error: 'Internal Server Error' });
      }
  }
}


export function isLoggedIn(req, res, next) {
  const token = req.cookies ? req.cookies.access_token : undefined;

  if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No access token provided' });
  }

  try {
      const decoded = jwt.verify(token, SECRET);
      next();
  } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
          return res.status(401).json({ error: 'Unauthorized - Invalid access token' });
      } else {
          console.error('Error verifying access token:', error);
          return res.status(500).json({ error: 'Internal Server Error' });
      }
  }
}