// seed-demo-data.mjs
//
// Populates your deployed StockFlow-ERP backend with realistic demo data:
// 12 customers, 12 products, and ~8 challans (mix of draft/confirmed).
//
// USAGE:
//   1. Set BASE_URL below to your live Render backend URL (no trailing slash).
//   2. Run:  node seed-demo-data.mjs
//   3. Requires Node 18+ (uses built-in fetch). You have v22, so you're fine.
//
// This uses your seeded demo accounts (admin/sales/warehouse) to log in and
// call the same REST endpoints your frontend uses — nothing special, no
// direct DB access needed.

const BASE_URL = 'https://stockflow-erp-backend.onrender.com'; // <-- change if different

const CREDENTIALS = {
  sales: { email: 'sales@fundsroom.com', password: 'Sales@123' },
  warehouse: { email: 'warehouse@fundsroom.com', password: 'Warehouse@123' },
};

async function login(role) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(CREDENTIALS[role]),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login failed for ${role}: ${JSON.stringify(data)}`);
  return data.token;
}

async function post(path, token, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`  FAILED ${path}:`, data.message || res.status);
    return null;
  }
  return data.item;
}

const CUSTOMERS = [
  { name: 'Ramesh Patel', mobileNumber: '9825011111', email: 'ramesh.patel@example.com', businessName: 'Patel Traders', customerType: 'Wholesale', address: 'Ring Road, Vadodara', status: 'Active', gstNumber: '24AAAPP1111A1Z5' },
  { name: 'Sunita Sharma', mobileNumber: '9825022222', email: 'sunita.sharma@example.com', businessName: 'Sharma Enterprises', customerType: 'Retail', address: 'MG Road, Ahmedabad', status: 'Active' },
  { name: 'Vikram Mehta', mobileNumber: '9825033333', email: 'vikram.mehta@example.com', businessName: 'Mehta Distribution Co.', customerType: 'Distributor', address: 'Industrial Estate, Surat', status: 'Active', gstNumber: '24AAAPM2222B1Z6' },
  { name: 'Priya Desai', mobileNumber: '9825044444', email: 'priya.desai@example.com', businessName: 'Desai Retail Store', customerType: 'Retail', address: 'Station Road, Anand', status: 'Lead' },
  { name: 'Anil Kumar', mobileNumber: '9825055555', email: 'anil.kumar@example.com', businessName: 'Kumar & Sons', customerType: 'Wholesale', address: 'Sector 12, Gandhinagar', status: 'Active' },
  { name: 'Neha Joshi', mobileNumber: '9825066666', email: 'neha.joshi@example.com', businessName: 'Joshi Hardware', customerType: 'Retail', address: 'Old City, Vadodara', status: 'Lead' },
  { name: 'Rajesh Iyer', mobileNumber: '9825077777', email: 'rajesh.iyer@example.com', businessName: 'Iyer Wholesale Mart', customerType: 'Wholesale', address: 'GIDC, Bharuch', status: 'Active', gstNumber: '24AAAPI3333C1Z7' },
  { name: 'Kavita Nair', mobileNumber: '9825088888', email: 'kavita.nair@example.com', businessName: 'Nair General Store', customerType: 'Retail', address: 'Market Yard, Nadiad', status: 'Inactive' },
  { name: 'Suresh Rao', mobileNumber: '9825099999', email: 'suresh.rao@example.com', businessName: 'Rao Distributors', customerType: 'Distributor', address: 'GIDC Makarpura, Vadodara', status: 'Active', gstNumber: '24AAAPR4444D1Z8' },
  { name: 'Meera Pillai', mobileNumber: '9825100000', email: 'meera.pillai@example.com', businessName: 'Pillai Traders', customerType: 'Wholesale', address: 'Ellora Park, Vadodara', status: 'Lead' },
  { name: 'Arjun Reddy', mobileNumber: '9825111100', email: 'arjun.reddy@example.com', businessName: 'Reddy Retail Hub', customerType: 'Retail', address: 'Race Course Road, Vadodara', status: 'Active' },
  { name: 'Divya Menon', mobileNumber: '9825122200', email: 'divya.menon@example.com', businessName: 'Menon Enterprises', customerType: 'Distributor', address: 'Alkapuri, Vadodara', status: 'Active', gstNumber: '24AAAPM5555E1Z9' },
];

const PRODUCTS = [
  { name: 'Steel Pipe 2-inch', sku: 'SP-2IN-001', category: 'Plumbing', unitPrice: '450.00', currentStock: '200', minStockAlertQuantity: '30', locationWarehouse: 'Warehouse A' },
  { name: 'Copper Wire 1.5mm', sku: 'CW-1.5-002', category: 'Electrical', unitPrice: '120.00', currentStock: '500', minStockAlertQuantity: '50', locationWarehouse: 'Warehouse A' },
  { name: 'PVC Conduit Pipe', sku: 'PVC-C-003', category: 'Electrical', unitPrice: '85.00', currentStock: '300', minStockAlertQuantity: '40', locationWarehouse: 'Warehouse B' },
  { name: 'Cement Bag 50kg', sku: 'CEM-50-004', category: 'Construction', unitPrice: '380.00', currentStock: '150', minStockAlertQuantity: '20', locationWarehouse: 'Warehouse B' },
  { name: 'LED Bulb 9W', sku: 'LED-9W-005', category: 'Electrical', unitPrice: '95.00', currentStock: '400', minStockAlertQuantity: '60', locationWarehouse: 'Warehouse A' },
  { name: 'Ball Valve 1-inch', sku: 'BV-1IN-006', category: 'Plumbing', unitPrice: '220.00', currentStock: '120', minStockAlertQuantity: '15', locationWarehouse: 'Warehouse A' },
  { name: 'MDF Board 18mm', sku: 'MDF-18-007', category: 'Woodwork', unitPrice: '1250.00', currentStock: '60', minStockAlertQuantity: '10', locationWarehouse: 'Warehouse C' },
  { name: 'Ceramic Floor Tile', sku: 'CFT-STD-008', category: 'Construction', unitPrice: '35.00', currentStock: '1000', minStockAlertQuantity: '100', locationWarehouse: 'Warehouse B' },
  { name: 'Angle Grinder 4-inch', sku: 'AG-4IN-009', category: 'Tools', unitPrice: '1450.00', currentStock: '25', minStockAlertQuantity: '5', locationWarehouse: 'Warehouse C' },
  { name: 'Safety Helmet', sku: 'SH-STD-010', category: 'Safety Gear', unitPrice: '180.00', currentStock: '80', minStockAlertQuantity: '15', locationWarehouse: 'Warehouse C' },
  { name: 'MCB Switch 32A', sku: 'MCB-32-011', category: 'Electrical', unitPrice: '210.00', currentStock: '90', minStockAlertQuantity: '20', locationWarehouse: 'Warehouse A' },
  { name: 'Water Storage Tank 500L', sku: 'WT-500L-012', category: 'Plumbing', unitPrice: '3200.00', currentStock: '18', minStockAlertQuantity: '4', locationWarehouse: 'Warehouse B' },
];

async function main() {
  console.log('Logging in...');
  const salesToken = await login('sales');
  const warehouseToken = await login('warehouse');
  console.log('Logged in as sales and warehouse.\n');

  console.log(`Creating ${CUSTOMERS.length} customers...`);
  const createdCustomers = [];
  for (const c of CUSTOMERS) {
    const item = await post('/customers', salesToken, c);
    if (item) {
      createdCustomers.push(item);
      console.log(`  + ${item.name}`);
    }
  }

  console.log(`\nCreating ${PRODUCTS.length} products...`);
  const createdProducts = [];
  for (const p of PRODUCTS) {
    const item = await post('/products', warehouseToken, p);
    if (item) {
      createdProducts.push(item);
      console.log(`  + ${item.name} (${item.sku})`);
    }
  }

  if (createdCustomers.length && createdProducts.length) {
    console.log('\nCreating sample challans...');
    const challanPlans = [
      { customerIdx: 0, status: 'confirmed', items: [{ p: 0, q: 5 }, { p: 1, q: 10 }] },
      { customerIdx: 1, status: 'draft', items: [{ p: 2, q: 8 }] },
      { customerIdx: 2, status: 'confirmed', items: [{ p: 3, q: 4 }, { p: 4, q: 20 }] },
      { customerIdx: 4, status: 'draft', items: [{ p: 5, q: 6 }] },
      { customerIdx: 6, status: 'confirmed', items: [{ p: 6, q: 2 }] },
      { customerIdx: 8, status: 'draft', items: [{ p: 7, q: 50 }, { p: 8, q: 1 }] },
      { customerIdx: 10, status: 'confirmed', items: [{ p: 9, q: 5 }] },
      { customerIdx: 11, status: 'draft', items: [{ p: 10, q: 3 }, { p: 11, q: 1 }] },
    ];

    for (const plan of challanPlans) {
      const customer = createdCustomers[plan.customerIdx];
      if (!customer) continue;
      const items = plan.items
        .map(({ p, q }) => createdProducts[p] && { productId: createdProducts[p].id, quantity: q })
        .filter(Boolean);
      if (!items.length) continue;

      const item = await post('/challans', salesToken, {
        customerId: customer.id,
        status: plan.status,
        items,
      });
      if (item) console.log(`  + ${item.challan_number} (${item.status}) for ${customer.name}`);
    }
  }

  console.log('\nDone. Refresh your app to see the demo data.');
}

main().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
