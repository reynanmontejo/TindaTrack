import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ProductAvatar } from '@/components/ProductAvatar';
import { QuantityStepper } from '@/components/QuantityStepper';
import { useAppData } from '@/data/AppDataContext';
import { colors, spacing } from '@/theme';
import { formatMoney } from '@/utils';

export default function CartScreen() {
  const {
    cart,
    cartCount,
    cartTotalCents,
    setCartQuantity,
    removeFromCart,
    clearCart,
    completeSale,
  } = useAppData();
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    try {
      setSaving(true);
      const id = await completeSale();
      router.replace({ pathname: '/sales/success', params: { id: String(id) } });
    } catch (error) {
      Alert.alert('Sale could not be saved', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    Alert.alert('Clear this sale?', 'All products in the current sale will be removed.', [
      { text: 'Keep Sale', style: 'cancel' },
      { text: 'Clear Sale', style: 'destructive', onPress: () => { clearCart(); router.back(); } },
    ]);
  };

  return (
    <AppScreen>
      {cart.length ? (
        <>
          <Text style={styles.intro}>Check the products and quantities before saving.</Text>
          <View style={styles.list}>
            {cart.map((item) => (
              <Card key={item.product.id} style={styles.item}>
                <View style={styles.topRow}>
                  <ProductAvatar name={item.product.name} imageUri={item.product.imageUri} />
                  <View style={styles.grow}>
                    <Text style={styles.name}>{item.product.name}</Text>
                    <Text style={styles.unit}>{formatMoney(item.product.sellingPriceCents)} per {item.product.unitName}</Text>
                  </View>
                  <Text style={styles.subtotal}>{formatMoney(item.product.sellingPriceCents * item.quantity)}</Text>
                </View>
                <View style={styles.controls}>
                  <QuantityStepper
                    value={item.quantity}
                    minimum={1}
                    maximum={item.product.currentStock}
                    onChange={(value) => setCartQuantity(item.product.id, value)}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.product.name} from sale`}
                    onPress={() => removeFromCart(item.product.id)}
                    style={styles.remove}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>{cartCount} {cartCount === 1 ? 'item' : 'items'}</Text>
              <Text style={styles.auto}>Stock updates automatically</Text>
            </View>
            <View style={styles.totalRight}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.total}>{formatMoney(cartTotalCents)}</Text>
            </View>
          </View>
          <AppButton label="Confirm Sale" icon="check-circle-outline" onPress={confirm} loading={saving} />
          <AppButton label="Continue Shopping" icon="arrow-left" variant="secondary" onPress={() => router.back()} />
          <AppButton label="Clear This Sale" icon="delete-outline" variant="text" onPress={discard} />
        </>
      ) : (
        <View>
          <EmptyState icon="cart-outline" title="Your sale is empty" message="Add products before confirming the sale." />
          <AppButton label="Choose Products" onPress={() => router.replace('/(tabs)/sell')} />
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  intro: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  list: { gap: spacing.md },
  item: { gap: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grow: { flex: 1 },
  name: { color: colors.text, fontSize: 18, fontWeight: '800' },
  unit: { color: colors.muted, fontSize: 14, marginTop: 2 },
  subtotal: { color: colors.text, fontSize: 18, fontWeight: '900' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  remove: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm },
  removeText: { color: colors.danger, fontSize: 14, fontWeight: '700' },
  totalRow: { borderTopWidth: 1.5, borderColor: colors.border, paddingTop: spacing.lg, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  totalRight: { alignItems: 'flex-end' },
  totalLabel: { color: colors.text, fontSize: 16, fontWeight: '700' },
  auto: { color: colors.muted, fontSize: 13, marginTop: 3 },
  total: { color: colors.forest, fontSize: 32, fontWeight: '900' },
});
