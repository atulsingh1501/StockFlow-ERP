import jwt from 'jsonwebtoken';
import type { NextFunction, Response } from 'express';
import type { AuthedRequest, JwtUser } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export function signToken(user: JwtUser) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function jwtAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }

  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET) as JwtUser;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}