import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ProductAvatar } from '@/components/ProductAvatar';
import { StatusBadge } from '@/components/StatusBadge';
import { useAppData } from '@/data/AppDataContext';
import { colors, radii, spacing } from '@/theme';
import type { Product, ProductStatus } from '@/types';
import { formatMoney } from '@/utils';

type Filter = 'ALL' | ProductStatus;

export default function StockScreen() {
  const params = useLocalSearchParams<{ filter?: string }>();
  const { service, revision } = useAppData();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [category, setCategory] = useState('ALL');
  const [categories, setCategories] = useState<string[]>([]);
  const [sort, setSort] = useState<'NAME' | 'STOCK_LOW' | 'PRICE_LOW' | 'MOST_SOLD'>('NAME');

  useEffect(() => {
    if (params.filter === 'LOW' || params.filter === 'OUT') setFilter(params.filter);
  }, [params.filter]);

  const load = useCallback(() => {
    if (!service) return;
    Promise.all([
      service.getProducts(search, filter, category, sort),
      service.getProductCategories(),
    ]).then(([items, nextCategories]) => {
      setProducts(items);
      setCategories(nextCategories);
    }).catch(console.error);
  }, [category, filter, search, service, sort]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load, revision]));

  const filters: Array<{ value: Filter; label: string }> = [
    { value: 'ALL', label: 'All' },
    { value: 'LOW', label: 'Running Low' },
    { value: 'OUT', label: 'Out of Stock' },
  ];

  return (
    <AppScreen>
      <View>
        <Text style={styles.title}>My Stock</Text>
        <Text style={styles.subtitle}>See what is available and what needs attention.</Text>
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
      <View style={styles.filters}>
        {filters.map((item) => (
          <Pressable
            key={item.value}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === item.value }}
            onPress={() => setFilter(item.value)}
            style={[styles.filter, filter === item.value && styles.filterActive]}
          >
            <Text style={[styles.filterText, filter === item.value && styles.filterTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      {categories.length ? (
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Category</Text>
          <View style={styles.filters}>
            {['ALL', ...categories].map((item) => (
              <Pressable key={item} onPress={() => setCategory(item)} style={[styles.smallFilter, category === item && styles.filterActive]}>
                <Text style={[styles.filterText, category === item && styles.filterTextActive]}>{item === 'ALL' ? 'All Categories' : item}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Sort by</Text>
        <View style={styles.filters}>
          {([['NAME', 'Name'], ['STOCK_LOW', 'Lowest Stock'], ['PRICE_LOW', 'Lowest Price'], ['MOST_SOLD', 'Most Sold']] as const).map(([value, label]) => (
            <Pressable key={value} onPress={() => setSort(value)} style={[styles.smallFilter, sort === value && styles.filterActive]}>
              <Text style={[styles.filterText, sort === value && styles.filterTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <AppButton label="Add New Product" icon="plus-circle-outline" variant="secondary" onPress={() => router.push('/products/add')} />
      <AppButton label="View Hidden Products" icon="eye-off-outline" variant="text" onPress={() => router.push('/products/hidden')} />

      {products.length ? (
        <View style={styles.list}>
          {products.map((product) => (
            <Pressable
              key={product.id}
              accessibilityRole="button"
              accessibilityLabel={`${product.name}, ${product.currentStock} left, ${formatMoney(product.sellingPriceCents)}, ${product.status}. Tap to view or update.`}
              onPress={() => router.push(`/products/${product.id}`)}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Card style={styles.productRow}>
                <ProductAvatar name={product.name} imageUri={product.imageUri} />
                <View style={styles.grow}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productInfo}>{product.currentStock} {product.unitName} left · {formatMoney(product.sellingPriceCents)}</Text>
                  <Text style={styles.helper}>Tap to view or update</Text>
                </View>
                <View style={styles.trailing}>
                  <StatusBadge status={product.status} />
                  <MaterialCommunityIcons name="chevron-right" size={23} color={colors.muted} />
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="package-variant"
          title="No products found"
          message={search || filter !== 'ALL' || category !== 'ALL' ? 'Try another search, category, or stock filter.' : 'Add your first product to begin tracking stock.'}
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 29, lineHeight: 35, fontWeight: '900', color: colors.text },
  subtitle: { color: colors.muted, fontSize: 15, marginTop: spacing.xs },
  search: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.md, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: 17, color: colors.text },
  filters: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  filterGroup: { gap: spacing.xs },
  filterLabel: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  filter: { minHeight: 42, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  filterActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  smallFilter: { minHeight: 38, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  filterText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  filterTextActive: { color: colors.white },
  list: { gap: spacing.sm },
  productRow: { padding: spacing.sm, minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grow: { flex: 1 },
  productName: { color: colors.text, fontSize: 17, fontWeight: '800' },
  productInfo: { color: colors.text, fontSize: 14, marginTop: 2 },
  helper: { color: colors.muted, fontSize: 12, marginTop: 3 },
  trailing: { alignItems: 'flex-end', gap: spacing.sm },
  pressed: { opacity: 0.72 },
});
