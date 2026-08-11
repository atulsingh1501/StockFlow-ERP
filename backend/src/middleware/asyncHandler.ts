import type { NextFunction, Request, Response } from 'express';

// Express 4 does not auto-forward rejected promises from async route handlers
// to the error middleware. Wrapping a handler in asyncHandler catches any
// thrown error / rejected promise and passes it to next(), so it reaches
// errorHandler in errorMiddleware.ts instead of hanging the request or
// crashing the process with an unhandled rejection.
export function asyncHandler<Req extends Request = Request>(
  fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Req, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
