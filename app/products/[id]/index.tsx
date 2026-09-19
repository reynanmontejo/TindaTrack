import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ProductAvatar } from '@/components/ProductAvatar';
import { StatusBadge } from '@/components/StatusBadge';
import { useAppData } from '@/data/AppDataContext';
import { colors, radii, spacing } from '@/theme';
import type { Product } from '@/types';
import { formatMoney } from '@/utils';

export default function ProductDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const { service, revision, archiveProduct } = useAppData();
  const [product, setProduct] = useState<Product | null>(null);

  const load = useCallback(() => {
    if (!service || !Number.isFinite(id)) return;
    service.getProduct(id).then(setProduct).catch(console.error);
  }, [id, service]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load, revision]));

  if (!product) return <LoadingScreen label="Loading product…" />;

  const hide = () => {
    Alert.alert(
      'Hide this product?',
      'It will be removed from product lists, but its sales and stock history will be kept.',
      [
        { text: 'Keep Product', style: 'cancel' },
        {
          text: 'Hide Product',
          style: 'destructive',
          onPress: async () => {
            await archiveProduct(product.id);
            router.replace('/(tabs)/stock');
          },
        },
      ],
    );
  };

  return (
    <AppScreen>
      <View style={styles.hero}>
        <ProductAvatar name={product.name} imageUri={product.imageUri} size={90} />
        <View style={styles.grow}>
          <Text style={styles.title}>{product.name}</Text>
          <StatusBadge status={product.status} />
        </View>
      </View>

      <Card style={styles.infoCard}>
        <InfoRow label={`${product.unitName} in stock`} value={String(product.currentStock)} />
        <InfoRow label={`Cost per ${product.unitName}`} value={formatMoney(product.costPriceCents)} />
        <InfoRow label={`Sell per ${product.unitName}`} value={formatMoney(product.sellingPriceCents)} />
        {product.unitsPerPack > 1 ? <InfoRow label={`${product.unitName} per ${product.packName}`} value={String(product.unitsPerPack)} /> : null}
        {product.category ? <InfoRow label="Category" value={product.category} /> : null}
        <InfoRow label="Low-stock alert at" value={String(product.lowStockLevel)} last />
      </Card>

      <View style={styles.actions}>
        <AppButton label="Add Stock" icon="plus-circle-outline" onPress={() => router.push(`/products/${id}/restock`)} />
        <AppButton label="Change Stock Count" icon="pencil-outline" variant="secondary" onPress={() => router.push(`/products/${id}/adjust`)} />
        <ActionRow icon="history" title="View Stock History" helper="See all stock changes" onPress={() => router.push(`/products/${id}/history`)} />
        <ActionRow icon="square-edit-outline" title="Edit Product Details" helper="Update name, photo, and prices" onPress={() => router.push(`/products/${id}/edit`)} />
      </View>

      <Pressable accessibilityRole="button" onPress={hide} style={styles.hide}>
        <MaterialCommunityIcons name="eye-off-outline" size={22} color={colors.muted} />
        <View style={styles.grow}>
          <Text style={styles.hideTitle}>Hide Product</Text>
          <Text style={styles.helper}>Removes it from product lists but keeps its history.</Text>
        </View>
      </Pressable>
    </AppScreen>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, last && styles.last]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ActionRow({ icon, title, helper, onPress }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; title: string; helper: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${helper}`} onPress={onPress} style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}>
      <MaterialCommunityIcons name={icon} size={25} color={colors.forest} />
      <View style={styles.grow}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.helper}>{helper}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  grow: { flex: 1, alignItems: 'flex-start' },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', marginBottom: spacing.sm },
  infoCard: { padding: 0, overflow: 'hidden' },
  infoRow: { minHeight: 52, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: colors.border },
  last: { borderBottomWidth: 0 },
  infoLabel: { color: colors.text, fontSize: 16 },
  infoValue: { color: colors.forest, fontSize: 17, fontWeight: '800' },
  actions: { gap: spacing.sm },
  actionRow: { minHeight: 69, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, backgroundColor: colors.white },
  actionTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  helper: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  hide: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  hideTitle: { color: colors.muted, fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});
