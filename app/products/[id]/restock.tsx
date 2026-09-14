import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { FormField } from '@/components/FormField';
import { LoadingScreen } from '@/components/LoadingScreen';
import { QuantityStepper } from '@/components/QuantityStepper';
import { useAppData } from '@/data/AppDataContext';
import { colors, spacing } from '@/theme';
import type { Product } from '@/types';
import { formatMoney, parseMoneyToCents } from '@/utils';

export default function RestockScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Number(rawId);
  const { service, restockProduct } = useAppData();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cost, setCost] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    service?.getProduct(id).then((item) => {
      setProduct(item);
      if (item) setCost(String(item.costPriceCents / 100));
    }).catch(console.error);
  }, [id, service]);

  if (!product) return <LoadingScreen label="Loading stock…" />;
  const nextStock = product.currentStock + quantity;
  const submit = async () => {
    try {
      setSaving(true);
      await restockProduct(id, quantity, parseMoneyToCents(cost));
      Alert.alert('Stock added', `${product.name} now has ${nextStock} items.`, [{ text: 'Done', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('Stock could not be added', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen>
      <Text style={styles.product}>{product.name}</Text>
      <Card style={styles.current}>
        <Text style={styles.label}>Current stock</Text>
        <Text style={styles.stock}>{product.currentStock}</Text>
      </Card>
      <View style={styles.group}>
        <Text style={styles.question}>How many are you adding?</Text>
        <View style={styles.center}><QuantityStepper value={quantity} minimum={1} onChange={setQuantity} /></View>
      </View>
      <FormField label="Bought for each" value={cost} onChangeText={setCost} keyboardType="decimal-pad" placeholder="₱0" />
      <Card style={styles.preview}>
        <Text style={styles.label}>New stock after adding</Text>
        <Text style={styles.stock}>{nextStock}</Text>
      </Card>
      <AppButton label={`Add ${quantity} to Stock`} icon="plus-circle-outline" onPress={submit} loading={saving} />
      <Text style={styles.help}>This restock will be saved in Stock History. Current cost becomes {formatMoney(parseMoneyToCents(cost))} for future sales only.</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  product: { color: colors.forest, fontSize: 18, fontWeight: '800' },
  current: { backgroundColor: colors.mint, borderColor: colors.sage, alignItems: 'center', gap: spacing.xs },
  label: { color: colors.muted, fontSize: 15 },
  stock: { color: colors.forest, fontSize: 37, fontWeight: '900' },
  group: { gap: spacing.md },
  question: { color: colors.text, fontSize: 18, fontWeight: '700' },
  center: { alignItems: 'center' },
  preview: { backgroundColor: colors.mint, borderColor: colors.sage, alignItems: 'center', gap: spacing.xs },
  help: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
