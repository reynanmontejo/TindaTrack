import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { FormField } from '@/components/FormField';
import { LoadingScreen } from '@/components/LoadingScreen';
import { QuantityStepper } from '@/components/QuantityStepper';
import { useAppData } from '@/data/AppDataContext';
import { colors, spacing } from '@/theme';
import type { Product } from '@/types';
import { calculateUnitCost, formatMoney, parseMoneyToCents } from '@/utils';

export default function RestockScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Number(rawId);
  const { service, restockProduct } = useAppData();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantityText, setQuantityText] = useState('1');
  const [cost, setCost] = useState('');
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'UNIT' | 'PACK'>('UNIT');

  useEffect(() => {
    service?.getProduct(id).then((item) => {
      setProduct(item);
      if (item) setCost(String(item.costPriceCents / 100));
    }).catch(console.error);
  }, [id, service]);

  if (!product) return <LoadingScreen label="Loading stock…" />;
  const quantity = Number(quantityText);
  const validQuantity = Number.isInteger(quantity) && quantity > 0;
  const unitsToAdd = validQuantity ? quantity * (mode === 'PACK' ? product.unitsPerPack : 1) : 0;
  const nextStock = product.currentStock + unitsToAdd;
  const submit = async () => {
    Keyboard.dismiss();
    if (!validQuantity) {
      Alert.alert('Enter the stock quantity', 'Type a whole number greater than zero.');
      return;
    }
    try {
      setSaving(true);
      const enteredCost = parseMoneyToCents(cost);
      const unitCost = mode === 'PACK' ? calculateUnitCost(enteredCost, product.unitsPerPack) : enteredCost;
      await restockProduct(id, unitsToAdd, unitCost);
      Alert.alert('Stock added', `${product.name} now has ${nextStock} ${product.unitName}.`, [{ text: 'Done', onPress: () => router.back() }]);
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
        {product.unitsPerPack > 1 ? (
          <View style={styles.modeRow}>
            <Pressable onPress={() => { setMode('UNIT'); setCost(String(product.costPriceCents / 100)); }} style={[styles.mode, mode === 'UNIT' && styles.modeActive]}>
              <Text style={[styles.modeText, mode === 'UNIT' && styles.modeTextActive]}>{product.unitName}</Text>
            </Pressable>
            <Pressable onPress={() => { setMode('PACK'); setCost(String((product.costPriceCents * product.unitsPerPack) / 100)); }} style={[styles.mode, mode === 'PACK' && styles.modeActive]}>
              <Text style={[styles.modeText, mode === 'PACK' && styles.modeTextActive]}>{product.packName} × {product.unitsPerPack}</Text>
            </Pressable>
          </View>
        ) : null}
        <FormField
          label="Quantity to add"
          value={quantityText}
          onChangeText={(value) => setQuantityText(value.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="done"
          placeholder="Example: 24"
          selectTextOnFocus
        />
        <View style={styles.center}>
          <QuantityStepper
            value={validQuantity ? quantity : 1}
            minimum={1}
            onChange={(value) => setQuantityText(String(value))}
          />
        </View>
      </View>
      <FormField label={`Bought for each ${mode === 'PACK' ? product.packName : product.unitName}`} value={cost} onChangeText={setCost} keyboardType="decimal-pad" inputMode="decimal" returnKeyType="done" placeholder="₱0" selectTextOnFocus />
      <Card style={styles.preview}>
        <Text style={styles.label}>New stock after adding</Text>
        <Text style={styles.stock}>{nextStock}</Text>
      </Card>
      <AppButton label={validQuantity ? `Add ${unitsToAdd} ${product.unitName}` : 'Add Stock'} icon="plus-circle-outline" onPress={submit} loading={saving} />
      <Text style={styles.help}>This restock will be saved in Stock History. Cost per {product.unitName} becomes {formatMoney(mode === 'PACK' ? calculateUnitCost(parseMoneyToCents(cost), product.unitsPerPack) : parseMoneyToCents(cost))} for future sales only.</Text>
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
  modeRow: { flexDirection: 'row', gap: spacing.sm },
  mode: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white },
  modeActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  modeText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  modeTextActive: { color: colors.white },
  preview: { backgroundColor: colors.mint, borderColor: colors.sage, alignItems: 'center', gap: spacing.xs },
  help: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
