export type ProductStatus = 'AVAILABLE' | 'LOW' | 'OUT';
export type SaleStatus = 'COMPLETED' | 'VOIDED';
export type StockMovementType =
  | 'SALE'
  | 'RESTOCK'
  | 'ADJUSTMENT'
  | 'PERSONAL_USE'
  | 'RETURN';

export interface Product {
  id: number;
  name: string;
  imageUri: string | null;
  category: string | null;
  costPriceCents: number;
  sellingPriceCents: number;
  currentStock: number;
  lowStockLevel: number;
  unitsPerPack: number;
  packName: string;
  unitName: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  status: ProductStatus;
}

export interface ProductInput {
  name: string;
  imageUri?: string | null;
  category?: string | null;
  costPriceCents: number;
  sellingPriceCents: number;
  currentStock: number;
  lowStockLevel: number;
  unitsPerPack?: number;
  packName?: string;
  unitName?: string;
}

export interface Expense {
  id: number;
  description: string;
  category: string;
  amountCents: number;
  businessDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseInput {
  description: string;
  category: string;
  amountCents: number;
  businessDate: string;
}

export interface CreditAccount {
  id: number;
  customerName: string;
  amountCents: number;
  paidCents: number;
  balanceCents: number;
  note: string;
  businessDate: string;
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
  createdAt: string;
  updatedAt: string;
}

export interface CreditInput {
  customerName: string;
  amountCents: number;
  note: string;
  businessDate: string;
}

export interface CreditPayment {
  id: number;
  creditId: number;
  amountCents: number;
  note: string;
  createdAt: string;
}

export interface CashSummary {
  date: string;
  salesCents: number;
  expenseCents: number;
  estimatedProfitCents: number;
  expectedCashCents: number;
  netAfterExpensesCents: number;
  actualCashCents: number | null;
  cashDifferenceCents: number | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleListItem {
  id: number;
  totalCents: number;
  profitCents: number;
  itemCount: number;
  primaryLabel: string;
  createdAt: string;
  businessDate: string;
  status: SaleStatus;
}

export interface SaleDetail extends SaleListItem {
  items: Array<{
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    costAtSaleCents: number;
    priceAtSaleCents: number;
    subtotalCents: number;
    profitCents: number;
  }>;
}

export interface StockMovement {
  id: number;
  type: StockMovementType;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: string | null;
  createdAt: string;
}

export interface DailySummary {
  date: string;
  totalSalesCents: number;
  estimatedProfitCents: number;
  itemsSold: number;
}

export interface DaySummary extends DailySummary {
  note: string;
  saleCount: number;
}

export interface DashboardData extends DailySummary {
  lowStockCount: number;
  lowStockProducts: Product[];
  recentSales: SaleListItem[];
  weekTotalCents: number;
  previousWeekTotalCents: number;
  weekChangePercent: number | null;
  highestDay: { date: string; totalCents: number } | null;
  lowestDay: { date: string; totalCents: number } | null;
}

export interface InsightsData {
  days: number;
  totalSalesCents: number;
  estimatedProfitCents: number;
  itemsSold: number;
  averagePerDayCents: number;
  changePercent: number | null;
  highestDay: { date: string; totalCents: number } | null;
  lowestDay: { date: string; totalCents: number } | null;
  daily: Array<{ date: string; totalCents: number }>;
  topProducts: ProductInsight[];
  slowProducts: ProductInsight[];
  restockSuggestions: ProductInsight[];
}

export interface ProductInsight {
  productId: number;
  name: string;
  unitsSold: number;
  revenueCents: number;
  profitCents: number;
  currentStock: number;
  averageUnitsPerDay: number;
  estimatedDaysLeft: number | null;
}

export interface BackupPayload {
  format: 'TINDATRACK_BACKUP';
  version: number;
  exportedAt: string;
  tables: Record<string, Array<Record<string, unknown>>>;
  files?: Record<string, { base64: string; extension: string }>;
}
