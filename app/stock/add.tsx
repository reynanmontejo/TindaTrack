import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ProductAvatar } from '@/components/ProductAvatar';
import { useAppData } from '@/data/AppDataContext';
import { colors, radii, spacing } from '@/theme';
import type { Product } from '@/types';

export default function ChooseStockProductScreen() {
  const { service, revision } = useAppData();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    service?.getProducts(search).then(setProducts).catch(console.error);
  }, [search, service]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load, revision]));

  return (
    <AppScreen>
      <View>
        <Text style={styles.title}>Add Stock</Text>
        <Text style={styles.subtitle}>Choose the product that has new stock.</Text>
      </View>
      <View style={styles.search}>
        <MaterialCommunityIcons name="magnify" size={24} color={colors.muted} />
        <TextInput
          accessibilityLabel="Search products to restock"
          placeholder="Search products"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          style={styles.searchInput}
        />
      </View>

      {products.length ? (
        <View style={styles.list}>
          {products.map((product) => (
            <Pressable
              key={product.id}
              accessibilityRole="button"
              accessibilityLabel={`Add stock to ${product.name}. Currently ${product.currentStock} left.`}
              onPress={() => router.push(`/products/${product.id}/restock`)}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Card style={styles.row}>
                <ProductAvatar name={product.name} imageUri={product.imageUri} />
                <View style={styles.grow}>
                  <Text style={styles.name}>{product.name}</Text>
                  <Text style={styles.stock}>{product.currentStock} {product.unitName} currently in stock</Text>
                </View>
                <View style={styles.addLabel}>
                  <MaterialCommunityIcons name="plus" size={19} color={colors.forest} />
                  <Text style={styles.addText}>Add</Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <EmptyState
            icon="package-variant"
            title={search ? 'No matching products' : 'No products yet'}
            message={search ? 'Try another product name.' : 'Add a product before adding stock.'}
          />
          {!search ? <AppButton label="Add New Product" icon="plus" onPress={() => router.push('/products/add')} /> : null}
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 29, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 15, marginTop: spacing.xs },
  search: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.md, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border },
  searchInput: { flex: 1, color: colors.text, fontSize: 17 },
  list: { gap: spacing.sm },
  row: { minHeight: 78, padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grow: { flex: 1 },
  name: { color: colors.text, fontSize: 17, fontWeight: '800' },
  stock: { color: colors.muted, fontSize: 14, marginTop: 3 },
  addLabel: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: spacing.sm },
  addText: { color: colors.forest, fontSize: 15, fontWeight: '800' },
  empty: { gap: spacing.md },
  pressed: { opacity: 0.7 },
});
