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
}
