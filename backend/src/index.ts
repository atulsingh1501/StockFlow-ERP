import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pool } from './db';
import { authRoutes } from './routes/authRoutes';
import { customerRoutes } from './routes/customerRoutes';
import { productRoutes } from './routes/productRoutes';
import { challanRoutes } from './routes/challanRoutes';
import { stockRoutes } from './routes/stockRoutes';
import { errorHandler, notFound } from './middleware/errorMiddleware';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

async function seedUsersIfEmpty() {
  const existing = await pool.query('select id from users limit 1');
  if (existing.rowCount) {
    return;
  }

  const seedUsers = [
    { name: 'Admin User', email: 'admin@fundsroom.com', password: 'Admin@123', role: 'admin' as const },
    { name: 'Sales User', email: 'sales@fundsroom.com', password: 'Sales@123', role: 'sales' as const },
    { name: 'Warehouse User', email: 'warehouse@fundsroom.com', password: 'Warehouse@123', role: 'warehouse' as const },
    { name: 'Accounts User', email: 'accounts@fundsroom.com', password: 'Accounts@123', role: 'accounts' as const }
  ];

  for (const user of seedUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await pool.query('insert into users (name, email, password_hash, role) values ($1, $2, $3, $4)', [user.name, user.email, passwordHash, user.role]);
  }
}

async function start() {
  await seedUsersIfEmpty();

  app.use('/auth', authRoutes);
  app.use('/customers', customerRoutes);
  app.use('/products', productRoutes);
  app.use('/challans', challanRoutes);
  app.use('/stock', stockRoutes);

  app.use(notFound);
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Backend listening on ${PORT}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});