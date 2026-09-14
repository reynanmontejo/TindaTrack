import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  CartItem,
  DashboardData,
  DailySummary,
  DaySummary,
  InsightsData,
  Product,
  ProductInput,
  ProductStatus,
  SaleDetail,
  SaleListItem,
  StockMovement,
  StockMovementType,
} from '@/types';
import {
  calculateChangePercent,
  localDateKey,
  shiftDateKey,
} from '@/utils';

type ProductRow = {
  id: number;
  name: string;
  image_uri: string | null;
  category: string | null;
  cost_price_cents: number;
  selling_price_cents: number;
  current_stock: number;
  low_stock_level: number;
  is_archived: number;
  created_at: string;
  updated_at: string;
};

type SaleRow = {
  id: number;
  total_cents: number;
  estimated_profit_cents: number;
  business_date: string;
  created_at: string;
  status: 'COMPLETED' | 'VOIDED';
  item_count: number;
  line_count: number;
  primary_name: string | null;
  primary_quantity: number | null;
};

function productStatus(row: Pick<ProductRow, 'current_stock' | 'low_stock_level'>): ProductStatus {
  if (row.current_stock === 0) return 'OUT';
  if (row.current_stock <= row.low_stock_level) return 'LOW';
  return 'AVAILABLE';
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    imageUri: row.image_uri,
    category: row.category,
    costPriceCents: row.cost_price_cents,
    sellingPriceCents: row.selling_price_cents,
    currentStock: row.current_stock,
    lowStockLevel: row.low_stock_level,
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: productStatus(row),
  };
}

function mapSale(row: SaleRow): SaleListItem {
  const primaryLabel = row.line_count === 1 && row.primary_name
    ? `${row.primary_name} × ${row.primary_quantity ?? row.item_count}`
    : `${row.item_count} items`;
  return {
    id: row.id,
    totalCents: row.total_cents,
    profitCents: row.estimated_profit_cents,
    itemCount: row.item_count,
    primaryLabel,
    createdAt: row.created_at,
    businessDate: row.business_date,
    status: row.status,
  };
}

const saleListSelect = `
  SELECT s.*,
    COALESCE(SUM(si.quantity), 0) AS item_count,
    COUNT(si.id) AS line_count,
    MIN(si.product_name) AS primary_name,
    MIN(si.quantity) AS primary_quantity
  FROM sales s
  JOIN sale_items si ON si.sale_id = s.id
`;

export class TindaTrackService {
  constructor(private readonly db: SQLiteDatabase) {}

  async getSetting(key: string): Promise<string | null> {
    const row = await this.db.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = ?',
      key,
    );
    return row?.value ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO app_settings(key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      key,
      value,
    );
  }

  async completeSetup(storeName: string): Promise<void> {
    await this.db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        `INSERT INTO app_settings(key, value) VALUES ('store_name', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        storeName.trim() || 'My Store',
      );
      await txn.runAsync(
        `INSERT INTO app_settings(key, value) VALUES ('setup_complete', 'true')
         ON CONFLICT(key) DO UPDATE SET value = 'true'`,
      );
    });
  }

  async getProducts(search = '', status: 'ALL' | ProductStatus = 'ALL'): Promise<Product[]> {
    const rows = await this.db.getAllAsync<ProductRow>(
      `SELECT * FROM products
       WHERE is_archived = 0 AND name LIKE ?
       ORDER BY name COLLATE NOCASE`,
      `%${search.trim()}%`,
    );
    const products = rows.map(mapProduct);
    return status === 'ALL' ? products : products.filter((product) => product.status === status);
  }

  async getProduct(id: number): Promise<Product | null> {
    const row = await this.db.getFirstAsync<ProductRow>('SELECT * FROM products WHERE id = ?', id);
    return row ? mapProduct(row) : null;
  }

  async addProduct(input: ProductInput): Promise<number> {
    const now = new Date().toISOString();
    let productId = 0;
    await this.db.withExclusiveTransactionAsync(async (txn) => {
      const result = await txn.runAsync(
        `INSERT INTO products(
          name, image_uri, category, cost_price_cents, selling_price_cents,
          current_stock, low_stock_level, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        input.name.trim(),
        input.imageUri ?? null,
        input.category?.trim() || null,
        input.costPriceCents,
        input.sellingPriceCents,
        input.currentStock,
        input.lowStockLevel,
        now,
        now,
      );
      productId = Number(result.lastInsertRowId);
      if (input.currentStock > 0) {
        await txn.runAsync(
          `INSERT INTO stock_movements(
            product_id, type, quantity_change, previous_stock, new_stock, reason, created_at
          ) VALUES (?, 'RESTOCK', ?, 0, ?, 'Starting stock', ?)`,
          productId,
          input.currentStock,
          input.currentStock,
          now,
        );
      }
    });
    return productId;
  }

  async updateProduct(id: number, input: Omit<ProductInput, 'currentStock'>): Promise<void> {
    await this.db.runAsync(
      `UPDATE products SET
        name = ?, image_uri = ?, category = ?, cost_price_cents = ?,
        selling_price_cents = ?, low_stock_level = ?, updated_at = ?
       WHERE id = ?`,
      input.name.trim(),
      input.imageUri ?? null,
      input.category?.trim() || null,
      input.costPriceCents,
      input.sellingPriceCents,
      input.lowStockLevel,
      new Date().toISOString(),
      id,
    );
  }

  async archiveProduct(id: number): Promise<void> {
    await this.db.runAsync(
      'UPDATE products SET is_archived = 1, updated_at = ? WHERE id = ?',
      new Date().toISOString(),
      id,
    );
  }

  async restockProduct(id: number, quantity: number, costPriceCents: number): Promise<void> {
    if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('Enter a valid stock quantity.');
    const now = new Date().toISOString();
    await this.db.withExclusiveTransactionAsync(async (txn) => {
      const product = await txn.getFirstAsync<ProductRow>('SELECT * FROM products WHERE id = ?', id);
      if (!product) throw new Error('Product was not found.');
      const nextStock = product.current_stock + quantity;
      await txn.runAsync(
        'UPDATE products SET current_stock = ?, cost_price_cents = ?, updated_at = ? WHERE id = ?',
        nextStock,
        costPriceCents,
        now,
        id,
      );
      await txn.runAsync(
        `INSERT INTO stock_movements(
          product_id, type, quantity_change, previous_stock, new_stock, reason, created_at
        ) VALUES (?, 'RESTOCK', ?, ?, ?, 'Added stock', ?)`,
        id,
        quantity,
        product.current_stock,
        nextStock,
        now,
      );
    });
  }

  async adjustStock(id: number, actualStock: number, reason: string): Promise<void> {
    if (!Number.isInteger(actualStock) || actualStock < 0) throw new Error('Enter a valid actual stock count.');
    const now = new Date().toISOString();
    await this.db.withExclusiveTransactionAsync(async (txn) => {
      const product = await txn.getFirstAsync<ProductRow>('SELECT * FROM products WHERE id = ?', id);
      if (!product) throw new Error('Product was not found.');
      const difference = actualStock - product.current_stock;
      if (difference === 0) return;
      const type: StockMovementType = reason === 'Personal use' ? 'PERSONAL_USE' : 'ADJUSTMENT';
      await txn.runAsync(
        'UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?',
        actualStock,
        now,
        id,
      );
      await txn.runAsync(
        `INSERT INTO stock_movements(
          product_id, type, quantity_change, previous_stock, new_stock, reason, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        id,
        type,
        difference,
        product.current_stock,
        actualStock,
        reason,
        now,
      );
    });
  }

  async getStockHistory(productId: number): Promise<StockMovement[]> {
    const rows = await this.db.getAllAsync<{
      id: number;
      type: StockMovementType;
      quantity_change: number;
      previous_stock: number;
      new_stock: number;
      reason: string | null;
      created_at: string;
    }>(
      'SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC, id DESC',
      productId,
    );
    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      quantityChange: row.quantity_change,
      previousStock: row.previous_stock,
      newStock: row.new_stock,
      reason: row.reason,
      createdAt: row.created_at,
    }));
  }

  async completeSale(cart: CartItem[]): Promise<number> {
    if (cart.length === 0) throw new Error('Add at least one product to the sale.');
    const now = new Date().toISOString();
    const businessDate = localDateKey();
    let saleId = 0;

    await this.db.withExclusiveTransactionAsync(async (txn) => {
      let totalCents = 0;
      let profitCents = 0;
      const currentProducts: Array<{ product: ProductRow; quantity: number }> = [];

      for (const item of cart) {
        const product = await txn.getFirstAsync<ProductRow>(
          'SELECT * FROM products WHERE id = ? AND is_archived = 0',
          item.product.id,
        );
        if (!product) throw new Error(`${item.product.name} is no longer available.`);
        if (item.quantity > product.current_stock) {
          throw new Error(`Not enough stock. Only ${product.current_stock} ${product.name} left.`);
        }
        totalCents += product.selling_price_cents * item.quantity;
        profitCents += (product.selling_price_cents - product.cost_price_cents) * item.quantity;
        currentProducts.push({ product, quantity: item.quantity });
      }

      const saleResult = await txn.runAsync(
        `INSERT INTO sales(total_cents, estimated_profit_cents, business_date, created_at, status)
         VALUES (?, ?, ?, ?, 'COMPLETED')`,
        totalCents,
        profitCents,
        businessDate,
        now,
      );
      saleId = Number(saleResult.lastInsertRowId);

      for (const { product, quantity } of currentProducts) {
        const subtotal = product.selling_price_cents * quantity;
        const profit = (product.selling_price_cents - product.cost_price_cents) * quantity;
        const newStock = product.current_stock - quantity;
        await txn.runAsync(
          `INSERT INTO sale_items(
            sale_id, product_id, product_name, quantity, cost_at_sale_cents,
            price_at_sale_cents, subtotal_cents, profit_cents
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          saleId,
          product.id,
          product.name,
          quantity,
          product.cost_price_cents,
          product.selling_price_cents,
          subtotal,
          profit,
        );
        await txn.runAsync(
          'UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?',
          newStock,
          now,
          product.id,
        );
        await txn.runAsync(
          `INSERT INTO stock_movements(
            product_id, sale_id, type, quantity_change, previous_stock, new_stock, reason, created_at
          ) VALUES (?, ?, 'SALE', ?, ?, ?, 'Sold', ?)`,
          product.id,
          saleId,
          -quantity,
          product.current_stock,
          newStock,
          now,
        );
      }
    });
    return saleId;
  }

  async undoSale(saleId: number): Promise<void> {
    const now = new Date().toISOString();
    await this.db.withExclusiveTransactionAsync(async (txn) => {
      const sale = await txn.getFirstAsync<{ status: string }>('SELECT status FROM sales WHERE id = ?', saleId);
      if (!sale) throw new Error('Sale was not found.');
      if (sale.status === 'VOIDED') throw new Error('This sale has already been undone.');
      const items = await txn.getAllAsync<{ product_id: number; quantity: number }>(
        'SELECT product_id, quantity FROM sale_items WHERE sale_id = ?',
        saleId,
      );
      for (const item of items) {
        const product = await txn.getFirstAsync<ProductRow>('SELECT * FROM products WHERE id = ?', item.product_id);
        if (!product) continue;
        const restored = product.current_stock + item.quantity;
        await txn.runAsync(
          'UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?',
          restored,
          now,
          item.product_id,
        );
        await txn.runAsync(
          `INSERT INTO stock_movements(
            product_id, sale_id, type, quantity_change, previous_stock, new_stock, reason, created_at
          ) VALUES (?, ?, 'RETURN', ?, ?, ?, 'Sale undone', ?)`,
          item.product_id,
          saleId,
          item.quantity,
          product.current_stock,
          restored,
          now,
        );
      }
      await txn.runAsync("UPDATE sales SET status = 'VOIDED' WHERE id = ?", saleId);
    });
  }

  async getSales(startDate?: string, endDate?: string, limit?: number): Promise<SaleListItem[]> {
    const clauses = ["s.status = 'COMPLETED'"];
    const params: Array<string | number> = [];
    if (startDate) {
      clauses.push('s.business_date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      clauses.push('s.business_date <= ?');
      params.push(endDate);
    }
    const limitSql = limit ? ' LIMIT ?' : '';
    if (limit) params.push(limit);
    const rows = await this.db.getAllAsync<SaleRow>(
      `${saleListSelect}
       WHERE ${clauses.join(' AND ')}
       GROUP BY s.id
       ORDER BY s.created_at DESC, s.id DESC${limitSql}`,
      ...params,
    );
    return rows.map(mapSale);
  }

  async getSale(id: number): Promise<SaleDetail | null> {
    const row = await this.db.getFirstAsync<SaleRow>(
      `${saleListSelect} WHERE s.id = ? GROUP BY s.id`,
      id,
    );
    if (!row) return null;
    const items = await this.db.getAllAsync<{
      id: number;
      product_id: number;
      product_name: string;
      quantity: number;
      cost_at_sale_cents: number;
      price_at_sale_cents: number;
      subtotal_cents: number;
      profit_cents: number;
    }>('SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id', id);
    return {
      ...mapSale(row),
      items: items.map((item) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        costAtSaleCents: item.cost_at_sale_cents,
        priceAtSaleCents: item.price_at_sale_cents,
        subtotalCents: item.subtotal_cents,
        profitCents: item.profit_cents,
      })),
    };
  }

  async getDailySummary(date = localDateKey()): Promise<DailySummary> {
    const row = await this.db.getFirstAsync<{
      total_sales: number;
      total_profit: number;
      items_sold: number;
    }>(
      `SELECT
        COALESCE(SUM(s.total_cents), 0) AS total_sales,
        COALESCE(SUM(s.estimated_profit_cents), 0) AS total_profit,
        COALESCE(SUM((SELECT SUM(quantity) FROM sale_items WHERE sale_id = s.id)), 0) AS items_sold
       FROM sales s WHERE s.business_date = ? AND s.status = 'COMPLETED'`,
      date,
    );
    return {
      date,
      totalSalesCents: row?.total_sales ?? 0,
      estimatedProfitCents: row?.total_profit ?? 0,
      itemsSold: row?.items_sold ?? 0,
    };
  }

  async saveDailyNote(date: string, note: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      `INSERT INTO daily_notes(business_date, note, created_at, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(business_date) DO UPDATE SET note = excluded.note, updated_at = excluded.updated_at`,
      date,
      note,
      now,
      now,
    );
  }

  async getDailyNote(date: string): Promise<string> {
    const row = await this.db.getFirstAsync<{ note: string }>(
      'SELECT note FROM daily_notes WHERE business_date = ?',
      date,
    );
    return row?.note ?? '';
  }

  async getDaySummary(date: string): Promise<DaySummary> {
    const [summary, note, count] = await Promise.all([
      this.getDailySummary(date),
      this.getDailyNote(date),
      this.db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM sales WHERE business_date = ? AND status = 'COMPLETED'",
        date,
      ),
    ]);
    return { ...summary, note, saleCount: count?.count ?? 0 };
  }

  async getPastDays(limit = 30): Promise<DaySummary[]> {
    const rows = await this.db.getAllAsync<{ date: string }>(
      `SELECT business_date AS date FROM sales WHERE status = 'COMPLETED'
       UNION SELECT business_date AS date FROM daily_notes
       ORDER BY date DESC LIMIT ?`,
      limit,
    );
    return Promise.all(rows.map((row) => this.getDaySummary(row.date)));
  }

  async getInsights(days: number): Promise<InsightsData> {
    const today = localDateKey();
    const start = shiftDateKey(today, -(days - 1));
    const previousStart = shiftDateKey(start, -days);
    const previousEnd = shiftDateKey(start, -1);
    const rows = await this.db.getAllAsync<{ date: string; total_cents: number; profit_cents: number; items: number }>(
      `SELECT s.business_date AS date,
        SUM(s.total_cents) AS total_cents,
        SUM(s.estimated_profit_cents) AS profit_cents,
        SUM((SELECT SUM(quantity) FROM sale_items WHERE sale_id = s.id)) AS items
       FROM sales s
       WHERE s.status = 'COMPLETED' AND s.business_date BETWEEN ? AND ?
       GROUP BY s.business_date`,
      start,
      today,
    );
    const previous = await this.db.getFirstAsync<{ total_cents: number }>(
      `SELECT COALESCE(SUM(total_cents), 0) AS total_cents FROM sales
       WHERE status = 'COMPLETED' AND business_date BETWEEN ? AND ?`,
      previousStart,
      previousEnd,
    );
    const rowMap = new Map(rows.map((row) => [row.date, row]));
    const daily = Array.from({ length: days }, (_, index) => {
      const date = shiftDateKey(start, index);
      return { date, totalCents: rowMap.get(date)?.total_cents ?? 0 };
    });
    const totalSalesCents = rows.reduce((sum, row) => sum + row.total_cents, 0);
    const estimatedProfitCents = rows.reduce((sum, row) => sum + row.profit_cents, 0);
    const itemsSold = rows.reduce((sum, row) => sum + row.items, 0);
    const hasSales = totalSalesCents > 0;
    const highest = hasSales ? daily.reduce((a, b) => (b.totalCents > a.totalCents ? b : a)) : null;
    const lowest = hasSales ? daily.reduce((a, b) => (b.totalCents < a.totalCents ? b : a)) : null;
    return {
      days,
      totalSalesCents,
      estimatedProfitCents,
      itemsSold,
      averagePerDayCents: Math.round(totalSalesCents / days),
      changePercent: calculateChangePercent(totalSalesCents, previous?.total_cents ?? 0),
      highestDay: highest,
      lowestDay: lowest,
      daily,
    };
  }

  async getDashboard(): Promise<DashboardData> {
    const today = localDateKey();
    const [summary, recentSales, lowRows, insights] = await Promise.all([
      this.getDailySummary(today),
      this.getSales(today, today, 3),
      this.db.getAllAsync<ProductRow>(
        `SELECT * FROM products
         WHERE is_archived = 0 AND current_stock <= low_stock_level
         ORDER BY current_stock ASC, name COLLATE NOCASE`,
      ),
      this.getInsights(7),
    ]);
    const lowStockProducts = lowRows.map(mapProduct);
    const previousWeekTotalCents = insights.changePercent === null
      ? 0
      : Math.round(insights.totalSalesCents / (1 + insights.changePercent / 100));
    return {
      ...summary,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      recentSales,
      weekTotalCents: insights.totalSalesCents,
      previousWeekTotalCents,
      weekChangePercent: insights.changePercent,
      highestDay: insights.highestDay,
      lowestDay: insights.lowestDay,
    };
  }
}
