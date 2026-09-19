import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ProductAvatar } from '@/components/ProductAvatar';
import { useAppData } from '@/data/AppDataContext';
import { colors, spacing } from '@/theme';
import type { Product } from '@/types';

export default function HiddenProductsScreen() {
  const { service, revision, unarchiveProduct } = useAppData();
  const [products, setProducts] = useState<Product[]>([]);

  const load = useCallback(() => {
    service?.getArchivedProducts().then(setProducts).catch(console.error);
  }, [service]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load, revision]));

  const restore = async (product: Product) => {
    try {
      await unarchiveProduct(product.id);
      Alert.alert('Product restored', `${product.name} is visible in Stock and Sell again.`);
    } catch (error) {
      Alert.alert('Product could not be restored', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <AppScreen>
      <View>
        <Text style={styles.title}>Hidden Products</Text>
        <Text style={styles.subtitle}>Restore products without losing their sales or stock history.</Text>
      </View>
      {products.length ? products.map((product) => (
        <Card key={product.id} style={styles.row}>
          <ProductAvatar name={product.name} imageUri={product.imageUri} />
          <View style={styles.grow}>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.helper}>{product.currentStock} {product.unitName} in stock</Text>
          </View>
          <AppButton label="Restore" icon="eye-outline" variant="secondary" onPress={() => restore(product)} style={styles.restore} />
        </Card>
      )) : <EmptyState icon="eye-off-outline" title="No hidden products" message="Products you hide will appear here so they can be restored." />}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 29, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21, marginTop: spacing.xs },
  row: { padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: 1 },
  name: { color: colors.text, fontSize: 16, fontWeight: '800' },
  helper: { color: colors.muted, fontSize: 13, marginTop: 3 },
  restore: { minHeight: 44, paddingHorizontal: spacing.sm },
});
