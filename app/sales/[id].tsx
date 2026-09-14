import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ProductAvatar } from '@/components/ProductAvatar';
import { useAppData } from '@/data/AppDataContext';
import { colors, radii, spacing } from '@/theme';
import type { SaleDetail } from '@/types';
import { formatDate, formatMoney, formatTime } from '@/utils';

export default function SaleDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Number(rawId);
  const { service, revision, undoSale } = useAppData();
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [undoing, setUndoing] = useState(false);

  const load = useCallback(() => {
    service?.getSale(id).then(setSale).catch(console.error);
  }, [id, service]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load, revision]));

  if (!sale) return <LoadingScreen label="Loading sale…" />;

  const undo = () => {
    Alert.alert('Undo this sale?', 'This restores all sold items to stock and removes the sale from totals and insights.', [
      { text: 'Keep Sale', style: 'cancel' },
      {
        text: 'Undo Sale',
        style: 'destructive',
        onPress: async () => {
          try {
            setUndoing(true);
            await undoSale(sale.id);
            await load();
            Alert.alert('Sale undone', 'The sold items were restored to stock.');
          } catch (error) {
            Alert.alert('Sale could not be undone', error instanceof Error ? error.message : 'Please try again.');
          } finally {
            setUndoing(false);
          }
        },
      },
    ]);
  };

  return (
    <AppScreen>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{formatDate(sale.businessDate)} · {formatTime(sale.createdAt)}</Text>
        <View style={[styles.status, sale.status === 'VOIDED' && styles.voided]}>
          <Text style={[styles.statusText, sale.status === 'VOIDED' && styles.voidedText]}>{sale.status === 'COMPLETED' ? 'Completed' : 'Undone'}</Text>
        </View>
      </View>

      <Card>
        <Text style={styles.section}>Items Sold</Text>
        <View style={styles.items}>
          {sale.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <ProductAvatar name={item.productName} size={48} />
              <View style={styles.grow}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.helper}>{item.quantity} × {formatMoney(item.priceAtSaleCents)}</Text>
              </View>
              <Text style={styles.itemTotal}>{formatMoney(item.subtotalCents)}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.total}>{formatMoney(sale.totalCents)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.profitLabel}>Estimated Profit</Text>
          <Text style={styles.profit}>{formatMoney(sale.profitCents)}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <MaterialCommunityIcons name="package-variant" size={25} color={colors.forest} />
        <Text style={styles.infoText}>
          {sale.status === 'COMPLETED' ? 'Stock was updated automatically.' : 'Stock was restored when this sale was undone.'}
        </Text>
      </View>

      {sale.status === 'COMPLETED' ? (
        <>
          <AppButton label="Undo This Sale" icon="undo-variant" variant="secondary" onPress={undo} loading={undoing} />
          <Text style={styles.undoHelp}>Restores the sold items to stock.</Text>
        </>
      ) : null}
      <AppButton label="Back to Sales History" variant="text" onPress={() => router.replace('/(tabs)/sales-history')} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  meta: { flex: 1, color: colors.muted, fontSize: 14 },
  status: { backgroundColor: colors.mint, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 7 },
  statusText: { color: colors.forest, fontSize: 13, fontWeight: '800' },
  voided: { backgroundColor: colors.dangerSoft },
  voidedText: { color: colors.danger },
  section: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: spacing.md },
  items: { gap: spacing.md },
  itemRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grow: { flex: 1 },
  itemName: { color: colors.text, fontSize: 16, fontWeight: '800' },
  helper: { color: colors.muted, fontSize: 14 },
  itemTotal: { color: colors.text, fontSize: 17, fontWeight: '900' },
  totals: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, paddingVertical: spacing.md, gap: spacing.sm },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: colors.text, fontSize: 19, fontWeight: '800' },
  total: { color: colors.text, fontSize: 25, fontWeight: '900' },
  profitLabel: { color: colors.forest, fontSize: 17, fontWeight: '700' },
  profit: { color: colors.forest, fontSize: 20, fontWeight: '900' },
  info: { minHeight: 66, padding: spacing.md, backgroundColor: colors.mint, borderRadius: radii.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  infoText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 21 },
  undoHelp: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: -spacing.sm },
});
