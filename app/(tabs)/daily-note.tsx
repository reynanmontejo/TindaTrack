import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { SectionHeader } from '@/components/SectionHeader';
import { useAppData } from '@/data/AppDataContext';
import { colors, radii, spacing } from '@/theme';
import type { DailySummary, DaySummary } from '@/types';
import { formatDate, formatMoney, localDateKey } from '@/utils';

export default function DailyNoteScreen() {
  const { service, revision, saveDailyNote } = useAppData();
  const today = localDateKey();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [pastDays, setPastDays] = useState<DaySummary[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!service) return;
    Promise.all([
      service.getDailySummary(today),
      service.getDailyNote(today),
      service.getPastDays(14),
    ]).then(([nextSummary, nextNote, days]) => {
      setSummary(nextSummary);
      setNote(nextNote);
      setPastDays(days.filter((day) => day.date !== today));
    }).catch(console.error);
  }, [service, today]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load, revision]));

  const save = async () => {
    try {
      setSaving(true);
      await saveDailyNote(today, note);
      Alert.alert('Note saved', 'Today’s note is safely stored on this device.');
    } catch (error) {
      Alert.alert('Note could not be saved', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen>
      <View>
        <Text style={styles.title}>Daily Note</Text>
        <Text style={styles.date}>{formatDate(today)}</Text>
      </View>

      <Card style={styles.summary}>
        <View style={styles.metric}>
          <MaterialCommunityIcons name="cash" size={23} color={colors.forest} />
          <Text style={styles.metricLabel}>Today’s Sales</Text>
          <Text style={styles.metricValue}>{formatMoney(summary?.totalSalesCents ?? 0)}</Text>
        </View>
        <View style={styles.metric}>
          <MaterialCommunityIcons name="wallet-outline" size={23} color={colors.forest} />
          <Text style={styles.metricLabel}>Estimated Profit</Text>
          <Text style={styles.metricValue}>{formatMoney(summary?.estimatedProfitCents ?? 0)}</Text>
        </View>
        <View style={styles.metric}>
          <MaterialCommunityIcons name="package-variant" size={23} color={colors.forest} />
          <Text style={styles.metricLabel}>Items Sold</Text>
          <Text style={styles.metricValue}>{summary?.itemsSold ?? 0}</Text>
        </View>
      </Card>

      <View style={styles.noteGroup}>
        <Text style={styles.sectionTitle}>My Note</Text>
        <TextInput
          accessibilityLabel="My note for today"
          placeholder="Example: Buy Coke tomorrow."
          placeholderTextColor={colors.muted}
          multiline
          value={note}
          onChangeText={setNote}
          style={styles.noteInput}
        />
        <AppButton label="Save Today’s Note" icon="content-save-outline" onPress={save} loading={saving} />
      </View>

      <View style={styles.pastSection}>
        <SectionHeader title="Past Days" />
        {pastDays.length ? pastDays.map((day) => (
          <Pressable
            key={day.date}
            accessibilityRole="button"
            accessibilityLabel={`${formatDate(day.date)}, ${formatMoney(day.totalSalesCents)}. View details.`}
            onPress={() => router.push(`/day/${day.date}`)}
            style={({ pressed }) => [styles.dayRow, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="calendar-blank-outline" size={23} color={colors.forest} />
            <Text style={styles.dayDate}>{formatDate(day.date, { month: 'long', day: 'numeric' })}</Text>
            <Text style={styles.dayTotal}>{formatMoney(day.totalSalesCents)}</Text>
            <Text style={styles.view}>View details</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
          </Pressable>
        )) : (
          <Text style={styles.emptyPast}>Past sales and notes will appear here automatically.</Text>
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 29, lineHeight: 35, fontWeight: '900', color: colors.text },
  date: { color: colors.forest, fontSize: 17, fontWeight: '700', marginTop: spacing.xs },
  summary: { backgroundColor: colors.mint, borderColor: colors.sage, flexDirection: 'row', paddingHorizontal: spacing.sm },
  metric: { flex: 1, minHeight: 118, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 4 },
  metricLabel: { color: colors.text, fontSize: 12, lineHeight: 16, textAlign: 'center' },
  metricValue: { color: colors.forest, fontSize: 19, fontWeight: '900', textAlign: 'center' },
  noteGroup: { gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  noteInput: { minHeight: 165, textAlignVertical: 'top', padding: spacing.md, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white, color: colors.text, fontSize: 17, lineHeight: 25 },
  pastSection: { gap: spacing.sm },
  dayRow: { minHeight: 65, paddingHorizontal: spacing.md, borderRadius: radii.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dayDate: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '700' },
  dayTotal: { color: colors.text, fontSize: 15, fontWeight: '800' },
  view: { color: colors.forest, fontSize: 12, fontWeight: '700' },
  emptyPast: { color: colors.muted, fontSize: 15, lineHeight: 22, paddingVertical: spacing.md },
  pressed: { opacity: 0.72 },
});
