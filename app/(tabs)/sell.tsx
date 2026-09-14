import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ProductAvatar } from '@/components/ProductAvatar';
import { useAppData } from '@/data/AppDataContext';
import { colors, radii, spacing } from '@/theme';
import type { Product } from '@/types';
import { formatMoney } from '@/utils';

export default function SellScreen() {
  const { service, revision, addToCart, cart, cartCount, cartTotalCents } = useAppData();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    if (!service) return;
    service.getProducts(search).then(setProducts).catch(console.error);
  }, [search, service]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load, revision]));

  const add = (product: Product) => {
    if (product.currentStock === 0) {
      Alert.alert('Out of stock', `${product.name} cannot be added until new stock arrives.`);
      return;
    }
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing && existing.quantity >= product.currentStock) {
      Alert.alert('Not enough stock', `Only ${product.currentStock} ${product.name} left.`);
      return;
    }
    addToCart(product);
  };

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.title}>Sell Products</Text>
        <Text style={styles.subtitle}>Tap Add beside each product the customer is buying.</Text>
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

      {products.length ? (
        <View style={styles.list}>
          <Text style={styles.section}>Products</Text>
          {products.map((product) => {
            const selected = cart.find((item) => item.product.id === product.id)?.quantity ?? 0;
            return (
              <Card key={product.id} style={styles.productRow}>
                <ProductAvatar name={product.name} imageUri={product.imageUri} />
                <View style={styles.grow}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productInfo}>{formatMoney(product.sellingPriceCents)} · {product.currentStock} left</Text>
                  {selected > 0 ? <Text style={styles.added}>{selected} in current sale</Text> : null}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${product.name} to sale`}
                  disabled={product.currentStock === 0}
                  onPress={() => add(product)}
                  style={({ pressed }) => [
                    styles.addButton,
                    product.currentStock === 0 && styles.unavailable,
                    pressed && styles.pressed,
                  ]}
                >
                  {product.currentStock === 0 ? (
                    <Text style={styles.unavailableText}>Unavailable</Text>
                  ) : (
                    <>
                      <MaterialCommunityIcons name="plus" size={20} color={colors.forest} />
                      <Text style={styles.addText}>Add</Text>
                    </>
                  )}
                </Pressable>
              </Card>
            );
          })}
        </View>
      ) : (
        <View>
          <EmptyState
            icon="package-variant-plus"
            title={search ? 'No matching products' : 'No products yet'}
            message={search ? 'Try another product name.' : 'Add your first product before recording a sale.'}
          />
          {!search ? <AppButton label="Add First Product" icon="plus" onPress={() => router.push('/products/add')} /> : null}
        </View>
      )}

      {cartCount > 0 ? (
        <View style={styles.cartBar}>
          <View style={styles.cartInfo}>
            <MaterialCommunityIcons name="cart-outline" size={25} color={colors.forest} />
            <View>
              <Text style={styles.cartCount}>{cartCount} {cartCount === 1 ? 'item' : 'items'}</Text>
              <Text style={styles.cartTotal}>{formatMoney(cartTotalCents)}</Text>
            </View>
          </View>
          <AppButton label="View Sale" onPress={() => router.push('/sales/cart')} style={styles.viewButton} />
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  title: { fontSize: 29, lineHeight: 35, fontWeight: '900', color: colors.text },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21, marginTop: spacing.xs },
  search: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.md, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: 17, color: colors.text },
  list: { gap: spacing.sm },
  section: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  productRow: { padding: spacing.sm, minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grow: { flex: 1 },
  productName: { color: colors.text, fontSize: 17, fontWeight: '800' },
  productInfo: { color: colors.muted, fontSize: 14, marginTop: 2 },
  added: { color: colors.forest, fontSize: 13, fontWeight: '700', marginTop: 3 },
  addButton: { minWidth: 76, minHeight: 48, flexDirection: 'row', gap: 3, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm, borderWidth: 1.5, borderColor: colors.forest, paddingHorizontal: spacing.sm },
  addText: { color: colors.forest, fontSize: 16, fontWeight: '800' },
  unavailable: { borderColor: colors.border, backgroundColor: '#F0F2F0' },
  unavailableText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  pressed: { opacity: 0.7 },
  cartBar: { padding: spacing.md, backgroundColor: colors.mint, borderRadius: radii.md, borderWidth: 1, borderColor: colors.sage, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  cartInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cartCount: { color: colors.muted, fontSize: 13 },
  cartTotal: { color: colors.forest, fontSize: 20, fontWeight: '900' },
  viewButton: { minWidth: 128 },
});
