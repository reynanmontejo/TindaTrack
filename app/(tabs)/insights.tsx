import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { useAppData } from '@/data/AppDataContext';
import { colors, radii, spacing } from '@/theme';
import type { InsightsData, ProductInsight } from '@/types';
import { formatDayName, formatMoney, formatShortDate } from '@/utils';

type PeriodDays = 7 | 30 | 90;

export default function InsightsScreen() {
  const { service, revision } = useAppData();
  const [days, setDays] = useState<PeriodDays>(7);
  const [data, setData] = useState<InsightsData | null>(null);

  const load = useCallback(() => {
    service?.getInsights(days).then(setData).catch(console.error);
  }, [days, service]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load, revision]));

  const bars = useMemo(() => {
    if (!data) return [];
    if (days === 7) return data.daily;
    const bucketSize = days === 30 ? 4 : 13;
    const result: Array<{ date: string; totalCents: number }> = [];
    for (let index = 0; index < data.daily.length; index += bucketSize) {
      const bucket = data.daily.slice(index, index + bucketSize);
      result.push({
        date: bucket[0].date,
        totalCents: bucket.reduce((sum, item) => sum + item.totalCents, 0),
      });
    }
    return result;
  }, [data, days]);

  const max = Math.max(...bars.map((item) => item.totalCents), 1);
  const insightMessage = data?.highestDay
    ? `Your sales were strongest on ${formatDayName(data.highestDay.date)}. Consider preparing extra stock before similar busy days.`
    : 'Record sales regularly to see your strongest and quietest days.';

  return (
    <AppScreen>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to Home" onPress={() => router.replace('/(tabs)')} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={25} color={colors.forest} />
          <Text style={styles.backText}>Home</Text>
        </Pressable>
        <Text style={styles.title}>Sales Insights</Text>
      </View>
      <View style={styles.periods}>
        {([
          [7, '7 Days'],
          [30, '30 Days'],
          [90, '3 Months'],
        ] as Array<[PeriodDays, string]>).map(([value, label]) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: days === value }}
            onPress={() => setDays(value)}
            style={[styles.period, days === value && styles.periodActive]}
          >
            <Text style={[styles.periodText, days === value && styles.periodTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Card style={styles.summary}>
        <View style={styles.summaryMetric}>
          <Text style={styles.summaryValue}>{formatMoney(data?.totalSalesCents ?? 0)}</Text>
          <Text style={styles.summaryLabel}>total sales</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryMetric}>
          <Text style={styles.summaryValue}>{formatMoney(data?.estimatedProfitCents ?? 0)}</Text>
          <Text style={styles.summaryLabel}>estimated profit</Text>
        </View>
      </Card>

      {(data?.totalSalesCents ?? 0) > 0 ? (
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>{days === 7 ? 'Sales by Day' : 'Sales Over Time'}</Text>
          <View style={styles.chart} accessibilityLabel="Sales bar chart">
            {bars.map((item, index) => (
              <View key={`${item.date}-${index}`} style={styles.barColumn}>
                <Text style={styles.barValue} numberOfLines={1}>{item.totalCents ? formatMoney(item.totalCents) : '₱0'}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, { height: `${Math.max((item.totalCents / max) * 100, item.totalCents ? 8 : 2)}%` }]} />
                </View>
                <Text style={styles.barLabel}>{days === 7 ? formatDayName(item.date).slice(0, 3) : formatShortDate(item.date)}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : (
        <EmptyState icon="chart-bar" title="Not enough sales data yet" message="Insights will appear automatically after you record sales." />
      )}

      <View style={styles.factRow}>
        <Card style={styles.factCard}>
          <MaterialCommunityIcons name="trophy-outline" size={28} color={colors.forest} />
          <Text style={styles.factLabel}>Highest sales day</Text>
          <Text style={styles.factDay}>{data?.highestDay ? formatDayName(data.highestDay.date) : '—'}</Text>
          <Text style={styles.factValue}>{data?.highestDay ? formatMoney(data.highestDay.totalCents) : 'No sales'}</Text>
        </Card>
        <Card style={styles.factCard}>
          <MaterialCommunityIcons name="arrow-down-circle-outline" size={28} color={colors.amber} />
          <Text style={styles.factLabel}>Lowest sales day</Text>
          <Text style={styles.factDay}>{data?.lowestDay ? formatDayName(data.lowestDay.date) : '—'}</Text>
          <Text style={styles.factValue}>{data?.lowestDay ? formatMoney(data.lowestDay.totalCents) : 'No sales'}</Text>
        </Card>
      </View>

      <Card style={styles.tip}>
        <MaterialCommunityIcons name="lightbulb-outline" size={30} color={colors.forest} />
        <Text style={styles.tipText}>{insightMessage}</Text>
      </Card>
      <Card style={styles.average}>
        <MaterialCommunityIcons name="chart-box-outline" size={29} color={colors.forest} />
        <View style={styles.grow}>
          <Text style={styles.factLabel}>Average per calendar day</Text>
          <Text style={styles.averageValue}>{formatMoney(data?.averagePerDayCents ?? 0)}</Text>
        </View>
        <Text style={[styles.change, (data?.changePercent ?? 0) < 0 && styles.down]}>
          {data?.changePercent == null ? 'No previous period' : `${data.changePercent >= 0 ? '↑' : '↓'} ${Math.abs(data.changePercent)}%`}
        </Text>
      </Card>
      <ProductInsightList
        title="Best-selling products"
        icon="star-circle-outline"
        items={data?.topProducts ?? []}
        empty="Record more sales to identify best sellers."
        detail={(item) => `${item.unitsSold} sold · ${formatMoney(item.revenueCents)} sales · ${formatMoney(item.profitCents)} profit`}
      />
      <ProductInsightList
        title="Slow-moving products"
        icon="snail"
        items={data?.slowProducts ?? []}
        empty="No stocked products to review."
        detail={(item) => `${item.unitsSold} sold · ${item.currentStock} still in stock`}
      />
      <ProductInsightList
        title="Restock suggestions"
        icon="package-variant-plus"
        items={data?.restockSuggestions ?? []}
        empty="No products need urgent restocking."
        detail={(item) => item.estimatedDaysLeft === null ? `${item.currentStock} left · no recent sales rate` : `${item.currentStock} left · about ${item.estimatedDaysLeft} days remaining`}
      />
      <Text style={styles.disclaimer}>Insights use completed sales only. Days without sales count as ₱0.</Text>
    </AppScreen>
  );
}

function ProductInsightList({ title, icon, items, empty, detail }: {
  title: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  items: ProductInsight[];
  empty: string;
  detail: (item: ProductInsight) => string;
}) {
  return (
    <Card style={styles.productInsights}>
      <View style={styles.productInsightHeader}>
        <MaterialCommunityIcons name={icon} size={26} color={colors.forest} />
        <Text style={styles.productInsightTitle}>{title}</Text>
      </View>
      {items.length ? items.map((item, index) => (
        <View key={item.productId} style={[styles.productInsightRow, index === items.length - 1 && styles.productInsightLast]}>
          <View style={styles.rank}><Text style={styles.rankText}>{index + 1}</Text></View>
          <View style={styles.grow}><Text style={styles.productName}>{item.name}</Text><Text style={styles.productDetail}>{detail(item)}</Text></View>
        </View>
      )) : <Text style={styles.productDetail}>{empty}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  back: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: colors.forest, fontSize: 16, fontWeight: '700' },
  title: { color: colors.text, fontSize: 29, fontWeight: '900' },
  periods: { minHeight: 48, flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, overflow: 'hidden', backgroundColor: colors.white },
  period: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  periodActive: { backgroundColor: colors.forest },
  periodText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  periodTextActive: { color: colors.white },
  summary: { backgroundColor: colors.mint, borderColor: colors.sage, flexDirection: 'row', alignItems: 'center' },
  summaryMetric: { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { color: colors.forest, fontSize: 24, fontWeight: '900' },
  summaryLabel: { color: colors.muted, fontSize: 13 },
  divider: { width: 1, height: 55, backgroundColor: colors.sage },
  chartCard: { gap: spacing.md },
  chartTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  chart: { height: 195, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  barColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  barValue: { color: colors.muted, fontSize: 9, width: '100%', textAlign: 'center' },
  barTrack: { flex: 1, width: '70%', justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: colors.green, borderTopLeftRadius: 5, borderTopRightRadius: 5, minHeight: 2 },
  barLabel: { color: colors.text, fontSize: 10, textAlign: 'center' },
  factRow: { flexDirection: 'row', gap: spacing.sm },
  factCard: { flex: 1, gap: 3, padding: spacing.md },
  factLabel: { color: colors.muted, fontSize: 12 },
  factDay: { color: colors.text, fontSize: 16, fontWeight: '800' },
  factValue: { color: colors.forest, fontSize: 17, fontWeight: '900' },
  tip: { backgroundColor: colors.mint, borderColor: colors.sage, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  tipText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 22 },
  average: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grow: { flex: 1 },
  averageValue: { color: colors.text, fontSize: 21, fontWeight: '900' },
  change: { color: colors.forest, fontSize: 15, fontWeight: '800' },
  down: { color: colors.amber },
  disclaimer: { color: colors.muted, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  productInsights: { gap: spacing.sm },
  productInsightHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  productInsightTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  productInsightRow: { minHeight: 57, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderBottomWidth: 1, borderColor: colors.border },
  productInsightLast: { borderBottomWidth: 0 },
  rank: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint },
  rankText: { color: colors.forest, fontSize: 13, fontWeight: '900' },
  productName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  productDetail: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
});
