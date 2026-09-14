import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ExtendedFab } from '@/components/ExtendedFab';
import { MetricCard } from '@/components/MetricCard';
import { ProductAvatar } from '@/components/ProductAvatar';
import { SectionHeader } from '@/components/SectionHeader';
import { useAppData } from '@/data/AppDataContext';
import { colors, radii, spacing } from '@/theme';
import type { DashboardData } from '@/types';
import { formatDayName, formatMoney, formatTime, greetingForNow } from '@/utils';

export default function HomeScreen() {
  const { service, revision, storeName } = useAppData();
  const [data, setData] = useState<DashboardData | null>(null);

  const load = useCallback(() => {
    if (!service) return;
    service.getDashboard().then(setData).catch(console.error);
  }, [service]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load, revision]));

  return (
    <View style={styles.flex}>
      <AppScreen contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.headingWrap}>
            <Text style={styles.greeting}>{greetingForNow()} 👋</Text>
            <Text style={styles.title}>Here’s your store today</Text>
            <Text style={styles.storeName}>{storeName}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Settings"
            onPress={() => router.push('/settings')}
            style={styles.settings}
          >
            <MaterialCommunityIcons name="cog-outline" size={20} color={colors.forest} />
            <Text style={styles.settingsText}>Settings</Text>
          </Pressable>
        </View>

        <View style={styles.metrics}>
          <MetricCard label="Today’s Sales" value={formatMoney(data?.totalSalesCents ?? 0)} icon="cash" />
          <MetricCard label="Estimated Profit" value={formatMoney(data?.estimatedProfitCents ?? 0)} icon="wallet-outline" />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${data?.lowStockCount ?? 0} products need restocking. View running low items.`}
          onPress={() => router.push({ pathname: '/(tabs)/stock', params: { filter: 'LOW' } })}
          style={({ pressed }) => [styles.alert, pressed && styles.pressed]}
        >
          <View style={styles.alertIcon}>
            <MaterialCommunityIcons name="bell-outline" size={25} color={colors.forest} />
          </View>
          <View style={styles.grow}>
            <Text style={styles.alertTitle}>
              {data?.lowStockCount ?? 0} {(data?.lowStockCount ?? 0) === 1 ? 'product needs' : 'products need'} restocking
            </Text>
            <Text style={styles.helper}>View running low items</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={26} color={colors.forest} />
        </Pressable>

        <View style={styles.sectionGap}>
          <SectionHeader title="Recent Sales" />
          {data?.recentSales.length ? (
            <View style={styles.list}>
              {data.recentSales.map((sale) => (
                <Pressable
                  key={sale.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${sale.primaryLabel}, ${formatMoney(sale.totalCents)}, ${formatTime(sale.createdAt)}. View sale details.`}
                  onPress={() => router.push(`/sales/${sale.id}`)}
                  style={({ pressed }) => [styles.saleRow, pressed && styles.pressed]}
                >
                  <ProductAvatar name={sale.primaryLabel} size={44} />
                  <View style={styles.grow}>
                    <Text style={styles.rowTitle}>{sale.primaryLabel}</Text>
                    <Text style={styles.helper}>{formatTime(sale.createdAt)}</Text>
                  </View>
                  <Text style={styles.rowAmount}>{formatMoney(sale.totalCents)}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
                </Pressable>
              ))}
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push('/(tabs)/sales-history')}
                style={styles.textLink}
              >
                <Text style={styles.linkText}>View All Sales</Text>
                <MaterialCommunityIcons name="arrow-right" size={19} color={colors.forest} />
              </Pressable>
            </View>
          ) : (
            <EmptyState
              icon="receipt-text-outline"
              title="No sales yet today"
              message="Tap Add Sale when you are ready to record your first customer sale."
            />
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View this week's sales insights"
          onPress={() => router.push('/(tabs)/insights')}
          style={({ pressed }) => [styles.insight, pressed && styles.pressed]}
        >
          <View style={styles.insightTop}>
            <MaterialCommunityIcons name="chart-bar" size={29} color={colors.forest} />
            <View style={styles.grow}>
              <Text style={styles.insightLabel}>This Week</Text>
              <Text style={styles.insightAmount}>{formatMoney(data?.weekTotalCents ?? 0)} total sales</Text>
            </View>
          </View>
          <Text style={styles.change}>
            {data?.weekChangePercent == null
              ? 'No previous sales to compare yet'
              : `${data.weekChangePercent >= 0 ? '↑' : '↓'} ${Math.abs(data.weekChangePercent)}% ${data.weekChangePercent >= 0 ? 'higher' : 'lower'} than last week`}
          </Text>
          <View style={styles.highLowRow}>
            <Text style={styles.fact}>
              Highest: {data?.highestDay ? `${formatDayName(data.highestDay.date)} ${formatMoney(data.highestDay.totalCents)}` : '—'}
            </Text>
            <Text style={styles.fact}>
              Lowest: {data?.lowestDay ? `${formatDayName(data.lowestDay.date)} ${formatMoney(data.lowestDay.totalCents)}` : '—'}
            </Text>
          </View>
          <View style={styles.textLink}>
            <Text style={styles.linkText}>View Insights</Text>
            <MaterialCommunityIcons name="arrow-right" size={19} color={colors.forest} />
          </View>
        </Pressable>
      </AppScreen>
      <ExtendedFab onPress={() => router.push('/(tabs)/sell')} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 122 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  headingWrap: { flex: 1 },
  greeting: { fontSize: 17, color: colors.forest, fontWeight: '600', marginBottom: spacing.xs },
  title: { fontSize: 27, lineHeight: 34, fontWeight: '900', color: colors.text },
  storeName: { fontSize: 14, color: colors.muted, marginTop: spacing.xs },
  settings: { minHeight: 44, paddingHorizontal: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radii.sm },
  settingsText: { color: colors.forest, fontSize: 14, fontWeight: '700' },
  metrics: { flexDirection: 'row', gap: spacing.sm },
  alert: {
    minHeight: 78,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: colors.sage,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  alertIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1 },
  alertTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  helper: { color: colors.muted, fontSize: 14, lineHeight: 19 },
  sectionGap: { gap: spacing.sm },
  list: { gap: spacing.sm },
  saleRow: {
    minHeight: 67,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowTitle: { fontSize: 16, color: colors.text, fontWeight: '700' },
  rowAmount: { fontSize: 17, color: colors.text, fontWeight: '800' },
  textLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start' },
  linkText: { color: colors.forest, fontSize: 15, fontWeight: '800', textDecorationLine: 'underline' },
  insight: { padding: spacing.lg, borderRadius: radii.md, backgroundColor: colors.mint, borderWidth: 1, borderColor: colors.sage, gap: spacing.sm },
  insightTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  insightLabel: { color: colors.forest, fontSize: 16, fontWeight: '700' },
  insightAmount: { color: colors.text, fontSize: 20, fontWeight: '900' },
  change: { color: colors.forest, fontSize: 14, fontWeight: '700' },
  highLowRow: { flexDirection: 'row', gap: spacing.sm, borderTopWidth: 1, borderColor: colors.sage, paddingTop: spacing.sm },
  fact: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 18 },
  pressed: { opacity: 0.78 },
});
