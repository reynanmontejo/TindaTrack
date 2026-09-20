import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useAppData } from '@/data/AppDataContext';
import { colors, radii, spacing } from '@/theme';
import type { Product, StockMovement } from '@/types';
import { formatDate, formatTime, localDateKey } from '@/utils';

const movementLabels: Record<StockMovement['type'], string> = {
  SALE: 'Sale',
  RESTOCK: 'Restocked',
  ADJUSTMENT: 'Stock corrected',
  PERSONAL_USE: 'Personal use',
  RETURN: 'Sale undone',
};

export default function StockHistoryScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Number(rawId);
  const { service, revision } = useAppData();
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[] | null>(null);

  const load = useCallback(() => {
    if (!service) return;
    Promise.all([service.getProduct(id), service.getStockHistory(id)])
      .then(([item, history]) => {
        setProduct(item);
        setMovements(history);
      })
      .catch(console.error);
  }, [id, service]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load, revision]));

  if (!product || !movements) return <LoadingScreen label="Loading stock history…" />;

  return (
    <AppScreen>
      <Text style={styles.product}>{product.name}</Text>
      <Card style={styles.current}>
        <MaterialCommunityIcons name="package-variant" size={40} color={colors.forest} />
        <Text style={styles.currentValue}>{product.currentStock}</Text>
        <Text style={styles.currentLabel}>items in stock</Text>
      </Card>
      {movements.length ? (
        <View style={styles.list}>
          {movements.map((movement, index) => {
            const movementDate = movement.createdAt.slice(0, 10);
            const previousDate = index > 0 ? movements[index - 1].createdAt.slice(0, 10) : null;
            const dateLabel = movementDate === localDateKey() ? 'Today' : formatDate(movementDate, { month: 'long', day: 'numeric' });
            return (
              <React.Fragment key={movement.id}>
                {movementDate !== previousDate ? <Text style={styles.dateHeading}>{dateLabel}</Text> : null}
                <Card style={styles.row}>
                  <View style={[styles.icon, movement.quantityChange < 0 && styles.negativeIcon]}>
                    <MaterialCommunityIcons
                      name={movement.quantityChange >= 0 ? 'plus' : 'minus'}
                      size={25}
                      color={movement.quantityChange >= 0 ? colors.forest : colors.amber}
                    />
                  </View>
                  <View style={styles.grow}>
                    <Text style={styles.rowTitle}>{movementLabels[movement.type]}</Text>
                    <Text style={styles.helper}>{movement.reason || movementLabels[movement.type]} · {formatTime(movement.createdAt)}</Text>
                  </View>
                  <View style={styles.numbers}>
                    <Text style={styles.stockRange}>{movement.previousStock} to {movement.newStock}</Text>
                    <Text style={[styles.quantity, movement.quantityChange < 0 && styles.negative]}>
                      {movement.quantityChange > 0 ? '+' : ''}{movement.quantityChange}
                    </Text>
                  </View>
                </Card>
              </React.Fragment>
            );
          })}
        </View>
      ) : (
        <EmptyState icon="history" title="No stock history yet" message="Sales, restocks, and corrections will appear here automatically." />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  product: { color: colors.forest, fontSize: 18, fontWeight: '800' },
  current: { backgroundColor: colors.mint, borderColor: colors.sage, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  currentValue: { color: colors.forest, fontSize: 40, fontWeight: '900' },
  currentLabel: { color: colors.text, fontSize: 15 },
  list: { gap: spacing.sm },
  dateHeading: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: spacing.sm },
  row: { minHeight: 76, padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  negativeIcon: { backgroundColor: colors.amberSoft },
  grow: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  helper: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  numbers: { alignItems: 'flex-end', gap: 2 },
  stockRange: { color: colors.muted, fontSize: 13 },
  quantity: { color: colors.forest, fontSize: 17, fontWeight: '900' },
  negative: { color: colors.amber },
});
