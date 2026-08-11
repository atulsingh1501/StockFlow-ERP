import type { Request } from 'express';

export type Role = 'admin' | 'sales' | 'warehouse' | 'accounts';

export type JwtUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AuthedRequest = Request & {
  user?: JwtUser;
};