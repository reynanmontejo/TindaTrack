import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useAppData } from '@/data/AppDataContext';
import { colors, spacing } from '@/theme';
import type { DaySummary } from '@/types';
import { formatDate, formatMoney } from '@/utils';

export default function PastDayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { service, revision } = useAppData();
  const [day, setDay] = useState<DaySummary | null>(null);

  const load = useCallback(() => {
    if (date) service?.getDaySummary(date).then(setDay).catch(console.error);
  }, [date, service]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load, revision]));

  if (!day) return <LoadingScreen label="Loading daily summary…" />;

  return (
    <AppScreen>
      <Text style={styles.title}>{formatDate(day.date, { month: 'long', day: 'numeric' })}</Text>
      <Text style={styles.year}>{formatDate(day.date, { year: 'numeric' })}</Text>
      <Card style={styles.summary}>
        <SummaryRow icon="cash" label="Total Sales" value={formatMoney(day.totalSalesCents)} />
        <SummaryRow icon="wallet-outline" label="Estimated Profit" value={formatMoney(day.estimatedProfitCents)} />
        <SummaryRow icon="package-variant" label="Items Sold" value={String(day.itemsSold)} last />
      </Card>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Note</Text>
        <Card><Text style={styles.note}>{day.note || 'No note was written for this day.'}</Text></Card>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sales Summary</Text>
        <Card style={styles.salesSummary}>
          <MaterialCommunityIcons name="cart-outline" size={27} color={colors.forest} />
          <Text style={styles.salesText}>{day.saleCount} {day.saleCount === 1 ? 'sale' : 'sales'} completed</Text>
        </Card>
        <AppButton
          label="View Sales from This Day"
          variant="secondary"
          onPress={() => router.push({ pathname: '/(tabs)/sales-history', params: { date: day.date } })}
        />
      </View>
      <AppButton label="Back to Daily Note" variant="text" onPress={() => router.replace('/(tabs)/daily-note')} />
    </AppScreen>
  );
}

function SummaryRow({ icon, label, value, last = false }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.summaryRow, last && styles.last]}>
      <MaterialCommunityIcons name={icon} size={25} color={colors.forest} />
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  year: { color: colors.forest, fontSize: 17, fontWeight: '700', marginTop: -spacing.md },
  summary: { backgroundColor: colors.mint, borderColor: colors.sage, padding: 0, overflow: 'hidden' },
  summaryRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderColor: colors.sage },
  last: { borderBottomWidth: 0 },
  summaryLabel: { flex: 1, color: colors.text, fontSize: 16 },
  summaryValue: { color: colors.forest, fontSize: 18, fontWeight: '900' },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  note: { color: colors.text, fontSize: 17, lineHeight: 25 },
  salesSummary: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  salesText: { color: colors.text, fontSize: 16, fontWeight: '700' },
});
