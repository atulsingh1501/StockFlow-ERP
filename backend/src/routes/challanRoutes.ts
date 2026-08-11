import { Router } from 'express';
import { pool } from '../db';
import { jwtAuth } from '../middleware/jwtAuth';
import { requireRole } from '../middleware/roleMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { createConfirmedMovement } from '../stockMovementLogic';
import type { AuthedRequest } from '../types';

export const challanRoutes = Router();

challanRoutes.use(jwtAuth, requireRole('sales'));

challanRoutes.get('/', async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.max(Number(req.query.limit || 10), 1);
  const offset = (page - 1) * limit;

  const countResult = await pool.query('select count(*)::int as total from challans');
  const result = await pool.query(
    `select c.*, cu.name as customer_name, u.name as created_by_name
     from challans c
     join customers cu on cu.id = c.customer_id
     join users u on u.id = c.created_by
     order by c.created_at desc
     limit $1 offset $2`,
    [limit, offset]
  );
  const total = Number(countResult.rows[0]?.total || 0);
  res.json({ items: result.rows, page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) });
});

challanRoutes.get('/:id', async (req, res) => {
  const challanResult = await pool.query(
    `select c.*, cu.name as customer_name, u.name as created_by_name
     from challans c
     join customers cu on cu.id = c.customer_id
     join users u on u.id = c.created_by
     where c.id = $1`,
    [req.params.id]
  );
  const itemsResult = await pool.query(
    `select ci.*, p.name as product_name, p.sku
     from challan_items ci
     join products p on p.id = ci.product_id
     where ci.challan_id = $1`,
    [req.params.id]
  );
  res.json({ item: challanResult.rows[0], items: itemsResult.rows });
});

challanRoutes.post('/', validateBody(['customerId', 'items']), async (req: AuthedRequest, res) => {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const payload = req.body;
    const customerId = payload.customerId;
    const items = Array.isArray(payload.items) ? payload.items : [];

    if (!customerId || !items.length) {
      throw new Error('Customer and items are required');
    }

    const status = payload.status === 'confirmed' ? 'confirmed' : 'draft';
    const challanNumber = `CH-${Date.now()}`;

    let totalQuantity = 0;
    const normalizedItems: Array<{ productId: string; quantity: number; snapshot: Record<string, unknown>; unitPrice: number }> = [];

    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!item.productId || !Number.isFinite(quantity) || quantity <= 0) {
        throw new Error('Invalid item');
      }
      const productResult = await client.query('select * from products where id = $1 and active = true', [item.productId]);
      const product = productResult.rows[0];
      if (!product) {
        throw new Error('Product not found');
      }
      const snapshot = {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        unitPrice: Number(product.unit_price),
        locationWarehouse: product.location_warehouse
      };
      normalizedItems.push({ productId: product.id, quantity, snapshot, unitPrice: Number(product.unit_price) });
      totalQuantity += quantity;
    }

    const challanResult = await client.query(
      'insert into challans (challan_number, customer_id, status, total_quantity, created_by) values ($1, $2, $3, $4, $5) returning *',
      [challanNumber, customerId, status, totalQuantity, req.user!.id]
    );
    const challan = challanResult.rows[0];

    for (const item of normalizedItems) {
      await client.query(
        'insert into challan_items (challan_id, product_id, product_snapshot, quantity, unit_price, line_total) values ($1, $2, $3, $4, $5, $6)',
        [challan.id, item.productId, item.snapshot, item.quantity, item.unitPrice, item.unitPrice * item.quantity]
      );
    }

    if (status === 'confirmed') {
      for (const item of normalizedItems) {
        const lockedProduct = await client.query('select * from products where id = $1 for update', [item.productId]);
        const product = lockedProduct.rows[0];
        if (!product || Number(product.current_stock) < item.quantity) {
          throw new Error(`Insufficient stock for ${item.snapshot.name}`);
        }
        await client.query('update products set current_stock = current_stock - $1 where id = $2', [item.quantity, item.productId]);
        await createConfirmedMovement(client, item.productId, item.quantity, challanNumber, req.user!.id);
      }
      await client.query('update challans set confirmed_at = now() where id = $1', [challan.id]);
    }

    await client.query('commit');
    res.status(201).json({ item: challan });
  } catch (error) {
    await client.query('rollback');
    const message = error instanceof Error ? error.message : 'Failed to create challan';
    res.status(400).json({ message });
  } finally {
    client.release();
  }
});

challanRoutes.post('/:id/confirm', async (req: AuthedRequest, res) => {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const challanResult = await client.query('select * from challans where id = $1 for update', [req.params.id]);
    const challan = challanResult.rows[0];
    if (!challan) {
      throw new Error('Challan not found');
    }
    if (challan.status === 'confirmed') {
      throw new Error('Challan already confirmed');
    }

    const itemsResult = await client.query('select * from challan_items where challan_id = $1', [req.params.id]);
    for (const item of itemsResult.rows) {
      const productResult = await client.query('select * from products where id = $1 for update', [item.product_id]);
      const product = productResult.rows[0];
      if (!product || Number(product.current_stock) < Number(item.quantity)) {
        throw new Error(`Insufficient stock for ${item.product_snapshot?.name || 'product'}`);
      }
      await client.query('update products set current_stock = current_stock - $1 where id = $2', [item.quantity, item.product_id]);
      await createConfirmedMovement(client, item.product_id, Number(item.quantity), challan.challan_number, req.user!.id);
    }

    await client.query('update challans set status = $1, confirmed_at = now() where id = $2', ['confirmed', req.params.id]);
    await client.query('commit');
    res.json({ ok: true });
  } catch (error) {
    await client.query('rollback');
    const message = error instanceof Error ? error.message : 'Failed to confirm challan';
    res.status(400).json({ message });
  } finally {
    client.release();
  }
});

// Only draft challans can be cancelled here. A confirmed challan already reduced stock and
// created stock_movements rows; cancelling it would require a compensating stock-reversal
// transaction, which is intentionally out of scope for this pass (see README "Known limitations").
challanRoutes.post('/:id/cancel', async (req: AuthedRequest, res) => {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const challanResult = await client.query('select * from challans where id = $1 for update', [req.params.id]);
    const challan = challanResult.rows[0];
    if (!challan) {
      throw new Error('Challan not found');
    }
    if (challan.status !== 'draft') {
      throw new Error('Only draft challans can be cancelled');
    }

    await client.query('update challans set status = $1 where id = $2', ['cancelled', req.params.id]);
    await client.query('commit');
    res.json({ ok: true });
  } catch (error) {
    await client.query('rollback');
    const message = error instanceof Error ? error.message : 'Failed to cancel challan';
    res.status(400).json({ message });
  } finally {
    client.release();
  }
});