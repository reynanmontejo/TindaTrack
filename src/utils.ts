export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateFromKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function shiftDateKey(key: string, amount: number): string {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + amount);
  return localDateKey(date);
}

export function formatDate(key: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-PH', options ?? {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(dateFromKey(key));
}

export function formatShortDate(key: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
  }).format(dateFromKey(key));
}

export function formatDayName(key: string): string {
  return new Intl.DateTimeFormat('en-PH', { weekday: 'long' }).format(dateFromKey(key));
}

export function formatTime(timestamp: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function formatMoney(cents: number): string {
  return `₱${new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100)}`;
}

export function parseMoneyToCents(value: string): number {
  const normalized = value.replace(/[^0-9.]/g, '');
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

export function calculateUnitCost(packCostCents: number, unitsPerPack: number): number {
  if (!Number.isInteger(unitsPerPack) || unitsPerPack <= 0) return 0;
  return Math.round(packCostCents / unitsPerPack);
}

export function calculateChangePercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function greetingForNow(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
