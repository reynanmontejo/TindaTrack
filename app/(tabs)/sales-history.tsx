import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ExtendedFab } from '@/components/ExtendedFab';
import { ProductAvatar } from '@/components/ProductAvatar';
import { useAppData } from '@/data/AppDataContext';
import { colors, radii, spacing } from '@/theme';
import type { SaleListItem } from '@/types';
import { formatDate, formatMoney, formatTime, localDateKey, shiftDateKey } from '@/utils';

type Period = 'TODAY' | 'WEEK' | 'MONTH';

export default function SalesHistoryScreen() {
  const { service, revision } = useAppData();
  const params = useLocalSearchParams<{ date?: string }>();
  const [period, setPeriod] = useState<Period>('TODAY');
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const today = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : localDateKey();

  const range = useMemo(() => {
    if (period === 'WEEK') return { start: shiftDateKey(today, -6), end: today };
    if (period === 'MONTH') return { start: `${today.slice(0, 8)}01`, end: today };
    return { start: today, end: today };
  }, [period, today]);

  const load = useCallback(() => {
    service?.getSales(range.start, range.end).then(setSales).catch(console.error);
  }, [range.end, range.start, service]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load, revision]));

  const total = sales.reduce((sum, sale) => sum + sale.totalCents, 0);
  const profit = sales.reduce((sum, sale) => sum + sale.profitCents, 0);
  const items = sales.reduce((sum, sale) => sum + sale.itemCount, 0);

  return (
    <View style={styles.flex}>
      <AppScreen contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to Home" onPress={() => router.replace('/(tabs)')} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={25} color={colors.forest} />
            <Text style={styles.backText}>Home</Text>
          </Pressable>
          <Text style={styles.title}>Sales History</Text>
        </View>
        <View style={styles.periods}>
          {([
            ['TODAY', 'Today'],
            ['WEEK', 'This Week'],
            ['MONTH', 'This Month'],
          ] as Array<[Period, string]>).map(([value, label]) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: period === value }}
              onPress={() => setPeriod(value)}
              style={[styles.period, period === value && styles.periodActive]}
            >
              <Text style={[styles.periodText, period === value && styles.periodTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <Card style={styles.summary}>
          <Text style={styles.summaryDate}>
            {period === 'TODAY' ? formatDate(today) : `${formatDate(range.start, { month: 'short', day: 'numeric' })} – ${formatDate(range.end, { month: 'short', day: 'numeric' })}`}
          </Text>
          <Text style={styles.summaryText}>{formatMoney(total)} total · {items} items · {formatMoney(profit)} profit</Text>
        </Card>

        {sales.length ? (
          <View style={styles.list}>
            {sales.map((sale) => (
              <Pressable
                key={sale.id}
                accessibilityRole="button"
                accessibilityLabel={`${formatTime(sale.createdAt)}, ${sale.primaryLabel}, ${formatMoney(sale.totalCents)}. View sale details.`}
                onPress={() => router.push(`/sales/${sale.id}`)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Card style={styles.saleRow}>
                  <ProductAvatar name={sale.primaryLabel} size={48} />
                  <View style={styles.grow}>
                    <Text style={styles.time}>{formatTime(sale.createdAt)}</Text>
                    <Text style={styles.saleName}>{sale.primaryLabel}</Text>
                    {period !== 'TODAY' ? <Text style={styles.helper}>{formatDate(sale.businessDate, { month: 'short', day: 'numeric' })}</Text> : null}
                    <Text style={styles.helper}>View sale details</Text>
                  </View>
                  <Text style={styles.amount}>{formatMoney(sale.totalCents)}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={23} color={colors.muted} />
                </Card>
              </Pressable>
            ))}
          </View>
        ) : (
          <EmptyState icon="receipt-text-outline" title="No sales in this period" message="Completed sales will appear here automatically." />
        )}
      </AppScreen>
      <ExtendedFab onPress={() => router.push('/(tabs)/sell')} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 128 },
  header: { gap: spacing.sm },
  back: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: colors.forest, fontSize: 16, fontWeight: '700' },
  title: { color: colors.text, fontSize: 29, fontWeight: '900' },
  periods: { minHeight: 48, flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, overflow: 'hidden', backgroundColor: colors.white },
  period: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  periodActive: { backgroundColor: colors.forest },
  periodText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  periodTextActive: { color: colors.white },
  summary: { backgroundColor: colors.mint, borderColor: colors.sage, gap: spacing.xs },
  summaryDate: { color: colors.text, fontSize: 17, fontWeight: '800' },
  summaryText: { color: colors.forest, fontSize: 15, fontWeight: '700' },
  list: { gap: spacing.sm },
  saleRow: { minHeight: 82, padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: 1 },
  time: { color: colors.muted, fontSize: 13 },
  saleName: { color: colors.text, fontSize: 16, fontWeight: '800' },
  helper: { color: colors.muted, fontSize: 12 },
  amount: { color: colors.text, fontSize: 17, fontWeight: '900' },
  pressed: { opacity: 0.72 },
});
