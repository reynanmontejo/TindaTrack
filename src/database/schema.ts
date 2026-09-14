import type { SQLiteDatabase } from 'expo-sqlite';

const SCHEMA_VERSION = 1;

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const current = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((current?.user_version ?? 0) >= SCHEMA_VERSION) return;

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        image_uri TEXT,
        category TEXT,
        cost_price_cents INTEGER NOT NULL CHECK (cost_price_cents >= 0),
        selling_price_cents INTEGER NOT NULL CHECK (selling_price_cents >= 0),
        current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
        low_stock_level INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_level >= 0),
        is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
        estimated_profit_cents INTEGER NOT NULL,
        business_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'VOIDED'))
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL REFERENCES sales(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        cost_at_sale_cents INTEGER NOT NULL,
        price_at_sale_cents INTEGER NOT NULL,
        subtotal_cents INTEGER NOT NULL,
        profit_cents INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL REFERENCES products(id),
        sale_id INTEGER REFERENCES sales(id),
        type TEXT NOT NULL CHECK (type IN ('SALE', 'RESTOCK', 'ADJUSTMENT', 'PERSONAL_USE', 'RETURN')),
        quantity_change INTEGER NOT NULL,
        previous_stock INTEGER NOT NULL,
        new_stock INTEGER NOT NULL CHECK (new_stock >= 0),
        reason TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS daily_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_date TEXT NOT NULL UNIQUE,
        note TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_products_active_name
        ON products(is_archived, name);
      CREATE INDEX IF NOT EXISTS idx_sales_date_status
        ON sales(business_date, status);
      CREATE INDEX IF NOT EXISTS idx_sale_items_sale
        ON sale_items(sale_id);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_product_date
        ON stock_movements(product_id, created_at DESC);
    `);
    await txn.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  });
}
