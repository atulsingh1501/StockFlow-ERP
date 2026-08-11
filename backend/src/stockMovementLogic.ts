import type { PoolClient } from 'pg';

export async function createConfirmedMovement(client: PoolClient, productId: string, quantity: number, challanNumber: string, createdBy: string) {
  await client.query(
    'insert into stock_movements (product_id, quantity_changed, movement_type, reason, created_by) values ($1, $2, $3, $4, $5)',
    [productId, -quantity, 'OUT', `Confirmed challan ${challanNumber}`, createdBy]
  );
}

export async function createRestockMovement(client: PoolClient, productId: string, quantity: number, reason: string, createdBy: string) {
  await client.query(
    'update products set current_stock = current_stock + $1 where id = $2',
    [quantity, productId]
  );
  await client.query(
    'insert into stock_movements (product_id, quantity_changed, movement_type, reason, created_by) values ($1, $2, $3, $4, $5)',
    [productId, quantity, 'IN', reason, createdBy]
  );
}