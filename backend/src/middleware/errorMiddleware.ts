import type { NextFunction, Request, Response } from 'express';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: 'Not found' });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  const message = error instanceof Error ? error.message : 'Server error';
  res.status(500).json({ message });
}