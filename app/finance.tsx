import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { FormField } from '@/components/FormField';
import { useAppData } from '@/data/AppDataContext';
import { colors, radii, spacing } from '@/theme';
import type { CashSummary, Expense } from '@/types';
import { formatDate, formatMoney, localDateKey, parseMoneyToCents } from '@/utils';

const CATEGORIES = ['Store', 'Transportation', 'Electricity', 'Food', 'Personal', 'Other'];

export default function FinanceScreen() {
  const { service, revision, refreshData } = useAppData();
  const today = localDateKey();
  const [summary, setSummary] = useState<CashSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Store');
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [actualCash, setActualCash] = useState('');

  const load = useCallback(() => {
    if (!service) return;
    Promise.all([service.getCashSummary(today), service.getExpenses()])
      .then(([nextSummary, items]) => {
        setSummary(nextSummary);
        setExpenses(items);
        setActualCash(nextSummary.actualCashCents === null ? '' : String(nextSummary.actualCashCents / 100));
      })
      .catch(console.error);
  }, [service, today]);

  useFocusEffect(useCallback(() => { load(); }, [load, revision]));

  const reset = () => {
    setEditingId(null);
    setDescription('');
    setAmount('');
    setCategory('Store');
    setDate(today);
    setShowForm(false);
  };

  const edit = (expense: Expense) => {
    setEditingId(expense.id);
    setDescription(expense.description);
    setAmount(String(expense.amountCents / 100));
    setCategory(expense.category);
    setDate(expense.businessDate);
    setShowForm(true);
  };

  const save = async () => {
    if (!service) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Check the date', 'Use the format YYYY-MM-DD.');
      return;
    }
    try {
      setSaving(true);
      const input = { description, category, amountCents: parseMoneyToCents(amount), businessDate: date };
      if (editingId) await service.updateExpense(editingId, input);
      else await service.addExpense(input);
      refreshData();
      reset();
      Alert.alert(editingId ? 'Expense updated' : 'Expense saved');
    } catch (error) {
      Alert.alert('Expense could not be saved', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (expense: Expense) => {
    Alert.alert('Delete this expense?', `${expense.description} · ${formatMoney(expense.amountCents)}`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await service?.deleteExpense(expense.id); refreshData(); } },
    ]);
  };

  const saveCashCount = async () => {
    if (!service) return;
    if (!actualCash.trim()) { Alert.alert('Enter the actual cash count'); return; }
    try {
      await service.saveCashCount(today, parseMoneyToCents(actualCash));
      refreshData();
      Alert.alert('Cash count saved');
    } catch (error) {
      Alert.alert('Cash count could not be saved', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <AppScreen>
      <View>
        <Text style={styles.title}>Expenses & Cash</Text>
        <Text style={styles.subtitle}>A simple daily estimate—not a full accounting report.</Text>
      </View>
      <Card style={styles.summary}>
        <SummaryRow label="Today’s sales" value={formatMoney(summary?.salesCents ?? 0)} />
        <SummaryRow label="Estimated profit" value={formatMoney(summary?.estimatedProfitCents ?? 0)} />
        <SummaryRow label="Today’s expenses" value={`− ${formatMoney(summary?.expenseCents ?? 0)}`} warning />
        <SummaryRow label="Expected cash after expenses" value={formatMoney(summary?.expectedCashCents ?? 0)} />
        <View style={styles.divider} />
        <SummaryRow label="Profit after expenses" value={formatMoney(summary?.netAfterExpensesCents ?? 0)} strong />
      </Card>
      <Card style={styles.cashCount}>
        <View>
          <Text style={styles.sectionTitle}>Count Today’s Cash</Text>
          <Text style={styles.infoText}>Enter the cash physically in the drawer. Compare only after considering starting cash and unpaid utang.</Text>
        </View>
        <FormField label="Actual cash counted" placeholder="₱0" value={actualCash} onChangeText={setActualCash} keyboardType="decimal-pad" inputMode="decimal" />
        {summary?.cashDifferenceCents !== null && summary?.cashDifferenceCents !== undefined ? (
          <Text style={[styles.difference, summary.cashDifferenceCents < 0 && styles.negative]}>
            Difference from expected: {summary.cashDifferenceCents >= 0 ? '+' : '−'} {formatMoney(Math.abs(summary.cashDifferenceCents))}
          </Text>
        ) : null}
        <AppButton label="Save Cash Count" icon="cash-check" variant="secondary" onPress={saveCashCount} />
      </Card>

      {!showForm ? (
        <AppButton label="Add Expense" icon="plus-circle-outline" onPress={() => setShowForm(true)} />
      ) : (
        <Card style={styles.form}>
          <Text style={styles.sectionTitle}>{editingId ? 'Edit Expense' : 'Add Expense'}</Text>
          <FormField label="What was it for?" placeholder="Example: Ice delivery" value={description} onChangeText={setDescription} />
          <FormField label="Amount" placeholder="₱0" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" inputMode="decimal" />
          <Text style={styles.label}>Category</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((item) => (
              <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipActive]}>
                <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <FormField label="Date" hint="Use YYYY-MM-DD" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />
          <AppButton label={editingId ? 'Save Changes' : 'Save Expense'} icon="content-save-outline" onPress={save} loading={saving} />
          <AppButton label="Cancel" variant="text" onPress={reset} />
        </Card>
      )}

      <View style={styles.list}>
        <Text style={styles.sectionTitle}>Expense History</Text>
        {expenses.length ? expenses.map((expense) => (
          <Card key={expense.id} style={styles.expenseRow}>
            <View style={styles.expenseIcon}><MaterialCommunityIcons name="cash-minus" size={23} color={colors.amber} /></View>
            <View style={styles.grow}>
              <Text style={styles.expenseName}>{expense.description}</Text>
              <Text style={styles.helper}>{expense.category} · {formatDate(expense.businessDate, { month: 'short', day: 'numeric' })}</Text>
            </View>
            <Text style={styles.expenseAmount}>{formatMoney(expense.amountCents)}</Text>
            <Pressable accessibilityLabel={`Edit ${expense.description}`} onPress={() => edit(expense)} style={styles.iconButton}><MaterialCommunityIcons name="pencil-outline" size={21} color={colors.forest} /></Pressable>
            <Pressable accessibilityLabel={`Delete ${expense.description}`} onPress={() => remove(expense)} style={styles.iconButton}><MaterialCommunityIcons name="trash-can-outline" size={21} color={colors.danger} /></Pressable>
          </Card>
        )) : <EmptyState icon="cash-minus" title="No expenses yet" message="Record store expenses to see profit after expenses." />}
      </View>
    </AppScreen>
  );
}

function SummaryRow({ label, value, strong, warning }: { label: string; value: string; strong?: boolean; warning?: boolean }) {
  return <View style={styles.summaryRow}><Text style={[styles.summaryLabel, strong && styles.strong]}>{label}</Text><Text style={[styles.summaryValue, strong && styles.strongValue, warning && styles.warning]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 29, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: spacing.xs },
  summary: { backgroundColor: colors.mint, borderColor: colors.sage, gap: spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  summaryLabel: { color: colors.text, fontSize: 15 },
  summaryValue: { color: colors.text, fontSize: 16, fontWeight: '800' },
  strong: { fontSize: 17, fontWeight: '800' },
  strongValue: { color: colors.forest, fontSize: 21, fontWeight: '900' },
  warning: { color: colors.amber },
  divider: { height: 1, backgroundColor: colors.sage },
  form: { gap: spacing.md },
  cashCount: { gap: spacing.md },
  infoText: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  difference: { color: colors.forest, fontSize: 15, fontWeight: '800' },
  negative: { color: colors.danger },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  label: { color: colors.text, fontSize: 16, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: 38, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: colors.white },
  list: { gap: spacing.sm },
  expenseRow: { padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  expenseIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.amberSoft, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1 },
  expenseName: { color: colors.text, fontSize: 16, fontWeight: '800' },
  helper: { color: colors.muted, fontSize: 12, marginTop: 3 },
  expenseAmount: { color: colors.text, fontSize: 16, fontWeight: '900' },
  iconButton: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
});
