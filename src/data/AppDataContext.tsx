import { openDatabaseAsync } from 'expo-sqlite';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { migrateDatabase } from '@/database/schema';
import { TindaTrackService } from '@/database/service';
import type { CartItem, Product, ProductInput } from '@/types';

interface AppDataValue {
  ready: boolean;
  setupComplete: boolean;
  storeName: string;
  service: TindaTrackService | null;
  revision: number;
  cart: CartItem[];
  cartCount: number;
  cartTotalCents: number;
  completeSetup: (storeName: string) => Promise<void>;
  updateStoreName: (storeName: string) => Promise<void>;
  addProduct: (input: ProductInput) => Promise<number>;
  updateProduct: (id: number, input: Omit<ProductInput, 'currentStock'>) => Promise<void>;
  archiveProduct: (id: number) => Promise<void>;
  restockProduct: (id: number, quantity: number, costPriceCents: number) => Promise<void>;
  adjustStock: (id: number, actualStock: number, reason: string) => Promise<void>;
  completeSale: () => Promise<number>;
  undoSale: (saleId: number) => Promise<void>;
  saveDailyNote: (date: string, note: string) => Promise<void>;
  addToCart: (product: Product) => void;
  setCartQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
}

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [service, setService] = useState<TindaTrackService | null>(null);
  const [ready, setReady] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [storeName, setStoreName] = useState('My Store');
  const [revision, setRevision] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const db = await openDatabaseAsync('tindatrack.db');
      await migrateDatabase(db);
      const nextService = new TindaTrackService(db);
      const [setup, name] = await Promise.all([
        nextService.getSetting('setup_complete'),
        nextService.getSetting('store_name'),
      ]);
      if (!active) return;
      setService(nextService);
      setSetupComplete(setup === 'true');
      setStoreName(name || 'My Store');
      setReady(true);
    })().catch((error) => {
      console.error('Failed to initialize TindaTrack database', error);
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const changed = useCallback(() => setRevision((value) => value + 1), []);

  const completeSetup = useCallback(async (name: string) => {
    if (!service) return;
    await service.completeSetup(name);
    setStoreName(name.trim() || 'My Store');
    setSetupComplete(true);
    changed();
  }, [changed, service]);

  const updateStoreName = useCallback(async (name: string) => {
    if (!service) return;
    const normalized = name.trim() || 'My Store';
    await service.setSetting('store_name', normalized);
    setStoreName(normalized);
    changed();
  }, [changed, service]);

  const addProduct = useCallback(async (input: ProductInput) => {
    if (!service) throw new Error('Database is not ready.');
    const id = await service.addProduct(input);
    changed();
    return id;
  }, [changed, service]);

  const updateProduct = useCallback(async (id: number, input: Omit<ProductInput, 'currentStock'>) => {
    if (!service) throw new Error('Database is not ready.');
    await service.updateProduct(id, input);
    changed();
  }, [changed, service]);

  const archiveProduct = useCallback(async (id: number) => {
    if (!service) throw new Error('Database is not ready.');
    await service.archiveProduct(id);
    setCart((items) => items.filter((item) => item.product.id !== id));
    changed();
  }, [changed, service]);

  const restockProduct = useCallback(async (id: number, quantity: number, costPriceCents: number) => {
    if (!service) throw new Error('Database is not ready.');
    await service.restockProduct(id, quantity, costPriceCents);
    changed();
  }, [changed, service]);

  const adjustStock = useCallback(async (id: number, actualStock: number, reason: string) => {
    if (!service) throw new Error('Database is not ready.');
    await service.adjustStock(id, actualStock, reason);
    changed();
  }, [changed, service]);

  const completeSale = useCallback(async () => {
    if (!service) throw new Error('Database is not ready.');
    const id = await service.completeSale(cart);
    setCart([]);
    changed();
    return id;
  }, [cart, changed, service]);

  const undoSale = useCallback(async (saleId: number) => {
    if (!service) throw new Error('Database is not ready.');
    await service.undoSale(saleId);
    changed();
  }, [changed, service]);

  const saveDailyNote = useCallback(async (date: string, note: string) => {
    if (!service) throw new Error('Database is not ready.');
    await service.saveDailyNote(date, note);
    changed();
  }, [changed, service]);

  const addToCart = useCallback((product: Product) => {
    setCart((items) => {
      const existing = items.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.currentStock) return items;
        return items.map((item) => item.product.id === product.id
          ? { ...item, product, quantity: item.quantity + 1 }
          : item);
      }
      return product.currentStock > 0 ? [...items, { product, quantity: 1 }] : items;
    });
  }, []);

  const setCartQuantity = useCallback((productId: number, quantity: number) => {
    setCart((items) => items
      .map((item) => item.product.id === productId
        ? { ...item, quantity: Math.max(0, Math.min(quantity, item.product.currentStock)) }
        : item)
      .filter((item) => item.quantity > 0));
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart((items) => items.filter((item) => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalCents = cart.reduce(
    (sum, item) => sum + item.product.sellingPriceCents * item.quantity,
    0,
  );

  const value = useMemo<AppDataValue>(() => ({
    ready,
    setupComplete,
    storeName,
    service,
    revision,
    cart,
    cartCount,
    cartTotalCents,
    completeSetup,
    updateStoreName,
    addProduct,
    updateProduct,
    archiveProduct,
    restockProduct,
    adjustStock,
    completeSale,
    undoSale,
    saveDailyNote,
    addToCart,
    setCartQuantity,
    removeFromCart,
    clearCart,
  }), [
    addProduct, addToCart, adjustStock, archiveProduct, cart, cartCount, cartTotalCents,
    clearCart, completeSale, completeSetup, ready, removeFromCart, restockProduct, revision,
    saveDailyNote, service, setCartQuantity, setupComplete, storeName, undoSale,
    updateProduct, updateStoreName,
  ]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataValue {
  const value = useContext(AppDataContext);
  if (!value) throw new Error('useAppData must be used inside AppDataProvider.');
  return value;
}
