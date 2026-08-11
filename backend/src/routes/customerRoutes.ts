import { Router } from 'express';
import { pool } from '../db';
import { jwtAuth } from '../middleware/jwtAuth';
import { requireRole } from '../middleware/roleMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { isValidEmail, isValidMobile } from '../middleware/validators';
import { asyncHandler } from '../middleware/asyncHandler';

export const customerRoutes = Router();

customerRoutes.use(jwtAuth, requireRole('sales', 'accounts'));

customerRoutes.get('/', asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim();
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.max(Number(req.query.limit || 10), 1);
  const offset = (page - 1) * limit;

  const countResult = await pool.query(
    `select count(*)::int as total
     from customers
     where ($1 = '' or name ilike '%' || $1 || '%' or business_name ilike '%' || $1 || '%' or mobile_number ilike '%' || $1 || '%')`,
    [search]
  );
  const result = await pool.query(
    `select * from customers
     where ($1 = '' or name ilike '%' || $1 || '%' or business_name ilike '%' || $1 || '%' or mobile_number ilike '%' || $1 || '%')
     order by created_at desc
     limit $2 offset $3`,
    [search, limit, offset]
  );
  const total = Number(countResult.rows[0]?.total || 0);
  res.json({ items: result.rows, page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) });
}));

customerRoutes.get('/:id', asyncHandler(async (req, res) => {
  const customerResult = await pool.query('select * from customers where id = $1', [req.params.id]);
  const customer = customerResult.rows[0];

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  const challansResult = await pool.query(
    `select c.id, c.challan_number, c.status, c.total_quantity, c.created_at
     from challans c
     where c.customer_id = $1
     order by c.created_at desc
     limit 10`,
    [req.params.id]
  );

  res.json({ item: customer, challans: challansResult.rows });
}));

customerRoutes.post('/:id/notes', validateBody(['note']), asyncHandler(async (req, res) => {
  const note = String(req.body.note || '').trim();

  if (!note) {
    return res.status(400).json({ message: 'Note is required' });
  }

  const currentResult = await pool.query('select notes from customers where id = $1', [req.params.id]);
  const customer = currentResult.rows[0];

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  const timestamp = new Date().toISOString();
  const nextNotes = [customer.notes, `${timestamp} | ${note}`].filter(Boolean).join('\n');

  const result = await pool.query('update customers set notes = $1, updated_at = now() where id = $2 returning *', [nextNotes, req.params.id]);
  res.status(201).json({ item: result.rows[0] });
}));

customerRoutes.post('/', validateBody(['name', 'mobileNumber', 'businessName', 'customerType', 'address', 'status']), asyncHandler(async (req, res) => {
  const body = req.body;

  if (!isValidMobile(body.mobileNumber)) {
    return res.status(400).json({ message: 'mobileNumber must be 7-15 digits' });
  }
  if (!isValidEmail(body.email)) {
    return res.status(400).json({ message: 'email is not a valid email address' });
  }

  const result = await pool.query(
    `insert into customers
     (name, mobile_number, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
    [body.name, body.mobileNumber, body.email || null, body.businessName, body.gstNumber || null, body.customerType, body.address, body.status, body.followUpDate || null, body.notes || null]
  );
  res.status(201).json({ item: result.rows[0] });
}));

customerRoutes.put('/:id', validateBody(['name', 'mobileNumber', 'businessName', 'customerType', 'address', 'status']), asyncHandler(async (req, res) => {
  const body = req.body;

  if (!isValidMobile(body.mobileNumber)) {
    return res.status(400).json({ message: 'mobileNumber must be 7-15 digits' });
  }
  if (!isValidEmail(body.email)) {
    return res.status(400).json({ message: 'email is not a valid email address' });
  }

  const result = await pool.query(
    `update customers set
      name=$1, mobile_number=$2, email=$3, business_name=$4, gst_number=$5,
      customer_type=$6, address=$7, status=$8, follow_up_date=$9, notes=$10
     where id=$11 returning *`,
    [body.name, body.mobileNumber, body.email || null, body.businessName, body.gstNumber || null, body.customerType, body.address, body.status, body.followUpDate || null, body.notes || null, req.params.id]
  );

  if (!result.rows[0]) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  res.json({ item: result.rows[0] });
}));

customerRoutes.delete('/:id', asyncHandler(async (req, res) => {
  await pool.query('delete from customers where id = $1', [req.params.id]);
  res.json({ ok: true });
}));