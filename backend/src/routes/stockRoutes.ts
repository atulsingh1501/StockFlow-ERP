import { Router } from 'express';
import { pool } from '../db';
import { jwtAuth } from '../middleware/jwtAuth';
import { requireRole } from '../middleware/roleMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { isPositiveInteger } from '../middleware/validators';
import { createRestockMovement } from '../stockMovementLogic';
import type { AuthedRequest } from '../types';

export const stockRoutes = Router();

stockRoutes.use(jwtAuth, requireRole('warehouse', 'accounts'));

stockRoutes.get('/movements', async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.max(Number(req.query.limit || 10), 1);
  const offset = (page - 1) * limit;

  const countResult = await pool.query('select count(*)::int as total from stock_movements');
  const result = await pool.query(
    `select sm.*, p.name as product_name, p.sku, u.name as created_by_name
     from stock_movements sm
     join products p on p.id = sm.product_id
     join users u on u.id = sm.created_by
     order by sm.created_at desc
     limit $1 offset $2`,
    [limit, offset]
  );
  const total = Number(countResult.rows[0]?.total || 0);
  res.json({ items: result.rows, page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) });
});

stockRoutes.post(
  '/movements/in',
  requireRole('warehouse'),
  validateBody(['productId', 'quantity']),
  async (req: AuthedRequest, res) => {
    const { productId, quantity, reason } = req.body;

    if (!isPositiveInteger(quantity)) {
      return res.status(400).json({ message: 'quantity must be a positive integer' });
    }

    const client = await pool.connect();
    try {
      await client.query('begin');
      const productResult = await client.query('select * from products where id = $1 and active = true for update', [productId]);
      const product = productResult.rows[0];
      if (!product) {
        throw new Error('Product not found');
      }

      await createRestockMovement(client, productId, Number(quantity), String(reason || 'Manual restock').trim(), req.user!.id);
      await client.query('commit');
      res.status(201).json({ ok: true });
    } catch (error) {
      await client.query('rollback');
      const message = error instanceof Error ? error.message : 'Failed to restock product';
      res.status(400).json({ message });
    } finally {
      client.release();
    }
  }
);