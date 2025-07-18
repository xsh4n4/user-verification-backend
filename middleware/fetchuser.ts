import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'Farman$isagoodboy';

interface AuthenticatedRequest extends Request {
  user?: any
}

const fetchuser = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const token = req.header('auth-token');
  if (!token) {
    res.status(401).send({ error: 'Please authenticate using a valid token' });
    return;
  }

  try {
    const data = jwt.verify(token, JWT_SECRET) as { user: any };
    req.user = data.user;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate using a valid token' });
  }
};

export default fetchuser;
