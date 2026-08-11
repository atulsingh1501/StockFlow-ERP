import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db';
import { jwtAuth, signToken } from '../middleware/jwtAuth';
import { validateBody } from '../middleware/validationMiddleware';
import type { AuthedRequest, JwtUser } from '../types';

export const authRoutes = Router();

authRoutes.post('/login', validateBody(['email', 'password']), async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('select * from users where email = $1', [email]);
  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(String(password || ''), user.password_hash);
  if (!ok) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const payload: JwtUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  return res.json({ token: signToken(payload), user: payload });
});

authRoutes.get('/me', jwtAuth, (req: AuthedRequest, res) => {
  res.json({ user: req.user });
});