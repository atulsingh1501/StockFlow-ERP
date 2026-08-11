import type { NextFunction, Request, Response } from 'express';

export function validateBody(requiredFields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing = requiredFields.filter((field) => req.body?.[field] === undefined || req.body?.[field] === '');
    if (missing.length) {
      return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });
    }
    next();
  };
}