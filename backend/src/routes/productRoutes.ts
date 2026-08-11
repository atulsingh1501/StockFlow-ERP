import { Router } from 'express';
import { pool } from '../db';
import { jwtAuth } from '../middleware/jwtAuth';
import { requireRole } from '../middleware/roleMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { isNonNegativeNumber } from '../middleware/validators';

export const productRoutes = Router();

productRoutes.use(jwtAuth, requireRole('warehouse', 'sales', 'accounts'));

productRoutes.get('/', async (req, res) => {
  const search = String(req.query.search || '').trim();
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.max(Number(req.query.limit || 10), 1);
  const offset = (page - 1) * limit;

  const countResult = await pool.query(
    `select count(*)::int as total
     from products
     where ($1 = '' or name ilike '%' || $1 || '%' or sku ilike '%' || $1 || '%' or category ilike '%' || $1 || '%')`,
    [search]
  );
  const result = await pool.query(
    `select * from products
     where ($1 = '' or name ilike '%' || $1 || '%' or sku ilike '%' || $1 || '%' or category ilike '%' || $1 || '%')
     order by created_at desc
     limit $2 offset $3`,
    [search, limit, offset]
  );
  const total = Number(countResult.rows[0]?.total || 0);
  res.json({ items: result.rows, page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) });
});

productRoutes.post('/', requireRole('warehouse'), validateBody(['name', 'sku', 'category', 'unitPrice', 'currentStock', 'minStockAlertQuantity', 'locationWarehouse']), async (req, res) => {
  const body = req.body;

  if (!isNonNegativeNumber(body.unitPrice) || !isNonNegativeNumber(body.currentStock) || !isNonNegativeNumber(body.minStockAlertQuantity)) {
    return res.status(400).json({ message: 'unitPrice, currentStock and minStockAlertQuantity must be non-negative numbers' });
  }

  const result = await pool.query(
    `insert into products
     (name, sku, category, unit_price, current_stock, min_stock_alert_quantity, location_warehouse)
     values ($1,$2,$3,$4,$5,$6,$7) returning *`,
    [body.name, body.sku, body.category, Number(body.unitPrice), Number(body.currentStock), Number(body.minStockAlertQuantity), body.locationWarehouse]
  );
  res.status(201).json({ item: result.rows[0] });
});

productRoutes.put('/:id', requireRole('warehouse'), validateBody(['name', 'sku', 'category', 'unitPrice', 'minStockAlertQuantity', 'locationWarehouse']), async (req, res) => {
  const body = req.body;

  if (!isNonNegativeNumber(body.unitPrice) || !isNonNegativeNumber(body.minStockAlertQuantity)) {
    return res.status(400).json({ message: 'unitPrice and minStockAlertQuantity must be non-negative numbers' });
  }

  const result = await pool.query(
    `update products set name=$1, sku=$2, category=$3, unit_price=$4, min_stock_alert_quantity=$5, location_warehouse=$6
     where id=$7 returning *`,
    [body.name, body.sku, body.category, Number(body.unitPrice), Number(body.minStockAlertQuantity), body.locationWarehouse, req.params.id]
  );
  res.json({ item: result.rows[0] });
});

productRoutes.delete('/:id', requireRole('warehouse'), async (req, res) => {
  await pool.query('update products set active = false where id = $1', [req.params.id]);
  res.json({ ok: true });
});