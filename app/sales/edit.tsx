import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ProductAvatar } from '@/components/ProductAvatar';
import { QuantityStepper } from '@/components/QuantityStepper';
import { useAppData } from '@/data/AppDataContext';
import { colors, radii, spacing } from '@/theme';
import type { CartItem, Product } from '@/types';
import { formatMoney } from '@/utils';

export default function EditSaleScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Number(rawId);
  const { service, updateSale } = useAppData();
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!service || !Number.isFinite(id)) return;
    (async () => {
      const [sale, activeProducts] = await Promise.all([service.getSale(id), service.getProducts()]);
      if (!sale || sale.status !== 'COMPLETED') {
        Alert.alert('Sale cannot be edited', 'This sale was not found or has already been undone.', [
          { text: 'Back', onPress: () => router.back() },
        ]);
        return;
      }

      const byId = new Map(activeProducts.map((product) => [product.id, product]));
      for (const item of sale.items) {
        if (!byId.has(item.productId)) {
          const product = await service.getProduct(item.productId);
          if (product) byId.set(product.id, product);
        }
      }
      const oldItems = new Map(sale.items.map((item) => [item.productId, item]));
      setProducts(Array.from(byId.values()).map((product) => {
        const old = oldItems.get(product.id);
        return old ? {
          ...product,
          currentStock: product.currentStock + old.quantity,
          costPriceCents: old.costAtSaleCents,
          sellingPriceCents: old.priceAtSaleCents,
        } : product;
      }));
      setQuantities(Object.fromEntries(sale.items.map((item) => [item.productId, item.quantity])));
    })().catch((error) => {
      Alert.alert('Sale could not be loaded', error instanceof Error ? error.message : 'Please try again.');
    }).finally(() => setLoading(false));
  }, [id, service]);

  const shownProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? products.filter((product) => product.name.toLowerCase().includes(term)) : products;
  }, [products, search]);

  const selectedItems = useMemo<CartItem[]>(() => products
    .filter((product) => (quantities[product.id] ?? 0) > 0)
    .map((product) => ({ product, quantity: quantities[product.id] })), [products, quantities]);
  const itemCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalCents = selectedItems.reduce((sum, item) => sum + item.quantity * item.product.sellingPriceCents, 0);

  const setQuantity = (product: Product, quantity: number) => {
    setQuantities((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[product.id];
      else next[product.id] = Math.min(quantity, product.currentStock);
      return next;
    });
  };

  const save = async () => {
    if (!selectedItems.length) {
      Alert.alert('Add at least one product', 'A sale cannot be saved without products. You can undo it from Sale Details instead.');
      return;
    }
    try {
      setSaving(true);
      await updateSale(id, selectedItems);
      Alert.alert('Sale updated', 'The sale totals and stock have been updated.', [
        { text: 'Done', onPress: () => router.replace(`/sales/${id}`) },
      ]);
    } catch (error) {
      Alert.alert('Sale could not be updated', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen label="Loading sale…" />;

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.title}>Edit Sale</Text>
        <Text style={styles.subtitle}>Change products or quantities. The original prices stay with this sale.</Text>
      </View>
      <View style={styles.search}>
        <MaterialCommunityIcons name="magnify" size={24} color={colors.muted} />
        <TextInput
          accessibilityLabel="Search products"
          placeholder="Search products"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.list}>
        {shownProducts.map((product) => {
          const quantity = quantities[product.id] ?? 0;
          return (
            <Card key={product.id} style={[styles.productCard, quantity > 0 && styles.selected]}>
              <View style={styles.productRow}>
                <ProductAvatar name={product.name} imageUri={product.imageUri} />
                <View style={styles.grow}>
                  <Text style={styles.name}>{product.name}</Text>
                  <Text style={styles.info}>{formatMoney(product.sellingPriceCents)} · up to {product.currentStock}</Text>
                </View>
                {quantity === 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${product.name}`}
                    disabled={product.currentStock === 0}
                    onPress={() => setQuantity(product, 1)}
                    style={({ pressed }) => [styles.add, product.currentStock === 0 && styles.disabled, pressed && styles.pressed]}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color={colors.forest} />
                    <Text style={styles.addText}>Add</Text>
                  </Pressable>
                ) : null}
              </View>
              {quantity > 0 ? (
                <View style={styles.quantityRow}>
                  <Text style={styles.quantityLabel}>Quantity</Text>
                  <QuantityStepper value={quantity} minimum={1} maximum={product.currentStock} onChange={(value) => setQuantity(product, value)} />
                  <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${product.name}`} onPress={() => setQuantity(product, 0)} style={styles.remove}>
                    <MaterialCommunityIcons name="trash-can-outline" size={21} color={colors.danger} />
                  </Pressable>
                </View>
              ) : null}
            </Card>
          );
        })}
      </View>

      <Card style={styles.summary}>
        <View>
          <Text style={styles.summaryLabel}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</Text>
          <Text style={styles.summaryHelp}>Stock updates automatically</Text>
        </View>
        <Text style={styles.total}>{formatMoney(totalCents)}</Text>
      </Card>
      <AppButton label="Save Sale Changes" icon="content-save-outline" onPress={save} loading={saving} disabled={!selectedItems.length} />
      <AppButton label="Cancel" variant="text" onPress={() => router.back()} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 44 },
  title: { color: colors.text, fontSize: 29, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21, marginTop: spacing.xs },
  search: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.md, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border },
  searchInput: { flex: 1, color: colors.text, fontSize: 17 },
  list: { gap: spacing.sm },
  productCard: { padding: spacing.sm, gap: spacing.sm },
  selected: { borderColor: colors.sage, backgroundColor: colors.mint },
  productRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grow: { flex: 1 },
  name: { color: colors.text, fontSize: 17, fontWeight: '800' },
  info: { color: colors.muted, fontSize: 14, marginTop: 3 },
  add: { minWidth: 74, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, borderWidth: 1.5, borderColor: colors.forest, borderRadius: radii.sm },
  addText: { color: colors.forest, fontSize: 15, fontWeight: '800' },
  quantityRow: { borderTopWidth: 1, borderTopColor: colors.sage, paddingTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  quantityLabel: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '700' },
  remove: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  summary: { backgroundColor: colors.mint, borderColor: colors.sage, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { color: colors.text, fontSize: 16, fontWeight: '800' },
  summaryHelp: { color: colors.muted, fontSize: 14, marginTop: 3 },
  total: { color: colors.forest, fontSize: 27, fontWeight: '900' },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
});
