import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { FormField } from '@/components/FormField';
import { useAppData } from '@/data/AppDataContext';
import { colors, radii, spacing } from '@/theme';
import type { CreditAccount, CreditPayment } from '@/types';
import { formatDate, formatMoney, formatTime, localDateKey, parseMoneyToCents } from '@/utils';

type Filter = 'OPEN' | 'PAID' | 'ALL';

export default function UtangScreen() {
  const { service, revision, refreshData } = useAppData();
  const today = localDateKey();
  const [filter, setFilter] = useState<Filter>('OPEN');
  const [credits, setCredits] = useState<CreditAccount[]>([]);
  const [selected, setSelected] = useState<{ account: CreditAccount; payments: CreditPayment[] } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(today);
  const [payment, setPayment] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    service?.getCredits(filter).then(setCredits).catch(console.error);
  }, [filter, service]);

  useFocusEffect(useCallback(() => { load(); }, [load, revision]));
  const totalOutstanding = useMemo(() => credits.reduce((sum, item) => sum + item.balanceCents, 0), [credits]);

  const resetForm = () => {
    setShowForm(false); setEditingId(null); setName(''); setAmount(''); setNote(''); setDate(today);
  };

  const edit = (account: CreditAccount) => {
    setSelected(null);
    setEditingId(account.id);
    setName(account.customerName);
    setAmount(String(account.amountCents / 100));
    setNote(account.note);
    setDate(account.businessDate);
    setShowForm(true);
  };

  const save = async () => {
    if (!service) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { Alert.alert('Check the date', 'Use YYYY-MM-DD.'); return; }
    try {
      setSaving(true);
      const input = { customerName: name, amountCents: parseMoneyToCents(amount), note, businessDate: date };
      if (editingId) await service.updateCredit(editingId, input);
      else await service.addCredit(input);
      refreshData();
      resetForm();
      Alert.alert(editingId ? 'Customer credit updated' : 'Customer credit saved');
    } catch (error) {
      Alert.alert('Customer credit could not be saved', error instanceof Error ? error.message : 'Please try again.');
    } finally { setSaving(false); }
  };

  const view = async (id: number) => {
    const detail = await service?.getCredit(id);
    setSelected(detail ?? null);
    setShowForm(false);
  };

  const recordPayment = async () => {
    if (!service || !selected) return;
    try {
      setSaving(true);
      await service.addCreditPayment(selected.account.id, parseMoneyToCents(payment), paymentNote);
      refreshData();
      setPayment(''); setPaymentNote('');
      setSelected(await service.getCredit(selected.account.id));
      Alert.alert('Payment recorded');
    } catch (error) {
      Alert.alert('Payment could not be saved', error instanceof Error ? error.message : 'Please try again.');
    } finally { setSaving(false); }
  };

  const remove = (account: CreditAccount) => {
    Alert.alert('Delete this customer credit record?', 'Its payment history will also be deleted.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await service?.deleteCredit(account.id); setSelected(null); refreshData(); } },
    ]);
  };

  return (
    <AppScreen>
      <View>
        <Text style={styles.title}>Customer Credit</Text>
        <Text style={styles.subtitle}>Track money customers owe and record partial payments.</Text>
      </View>
      <Card style={styles.summary}>
        <Text style={styles.summaryLabel}>{filter === 'OPEN' ? 'Outstanding balance' : 'Balance in this list'}</Text>
        <Text style={styles.summaryValue}>{formatMoney(totalOutstanding)}</Text>
        <Text style={styles.helper}>{credits.length} {credits.length === 1 ? 'record' : 'records'}</Text>
      </Card>
      <View style={styles.filters}>
        {([['OPEN', 'Unpaid'], ['PAID', 'Paid'], ['ALL', 'All']] as const).map(([value, label]) => (
          <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: filter === value }} accessibilityLabel={`${label} customer credit records`} onPress={() => { setFilter(value); setSelected(null); }} style={[styles.filter, filter === value && styles.filterActive]}>
            <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {!showForm && !selected ? <AppButton label="Add Customer Credit" icon="account-plus-outline" onPress={() => setShowForm(true)} /> : null}

      {showForm ? (
        <Card style={styles.form}>
          <Text style={styles.sectionTitle}>{editingId ? 'Edit Customer Credit' : 'Add Customer Credit'}</Text>
          <FormField label="Customer Name" placeholder="Example: Ana" value={name} onChangeText={setName} autoCapitalize="words" />
          <FormField label="Total Amount" placeholder="₱0" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" inputMode="decimal" />
          <FormField label="Date" hint="Use YYYY-MM-DD" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />
          <FormField label="Note" placeholder="Example: Rice and canned goods" value={note} onChangeText={setNote} multiline />
          <AppButton label={editingId ? 'Save Changes' : 'Save Customer Credit'} icon="content-save-outline" onPress={save} loading={saving} />
          <AppButton label="Cancel" variant="text" onPress={resetForm} />
        </Card>
      ) : null}

      {selected ? (
        <Card style={styles.detail}>
          <View style={styles.detailTop}>
            <View style={styles.grow}>
              <Text style={styles.sectionTitle}>{selected.account.customerName}</Text>
              <Text style={styles.helper}>{formatDate(selected.account.businessDate)}</Text>
            </View>
            <Text style={styles.balance}>{formatMoney(selected.account.balanceCents)}</Text>
          </View>
          <Text style={styles.detailLine}>Total: {formatMoney(selected.account.amountCents)} · Paid: {formatMoney(selected.account.paidCents)}</Text>
          {selected.account.note ? <Text style={styles.note}>{selected.account.note}</Text> : null}
          {selected.account.balanceCents > 0 ? (
            <View style={styles.paymentForm}>
              <Text style={styles.label}>Record Payment</Text>
              <FormField label="Amount Paid" placeholder="₱0" value={payment} onChangeText={setPayment} keyboardType="decimal-pad" inputMode="decimal" />
              <FormField label="Short Note" placeholder="Optional" value={paymentNote} onChangeText={setPaymentNote} />
              <AppButton label="Save Payment" icon="cash-check" onPress={recordPayment} loading={saving} />
            </View>
          ) : <Text style={styles.paid}>✓ Fully paid</Text>}
          <Text style={styles.label}>Payment History</Text>
          {selected.payments.length ? selected.payments.map((item) => (
            <View key={item.id} style={styles.paymentRow}>
              <View style={styles.grow}><Text style={styles.paymentAmount}>{formatMoney(item.amountCents)}</Text><Text style={styles.helper}>{formatTime(item.createdAt)} {item.note ? `· ${item.note}` : ''}</Text></View>
            </View>
          )) : <Text style={styles.helper}>No payments recorded yet.</Text>}
          <View style={styles.detailActions}>
            <AppButton label="Edit" icon="pencil-outline" variant="secondary" onPress={() => edit(selected.account)} style={styles.action} />
            <AppButton label="Delete" icon="trash-can-outline" variant="danger" onPress={() => remove(selected.account)} style={styles.action} />
          </View>
          <AppButton label="Back to List" variant="text" onPress={() => setSelected(null)} />
        </Card>
      ) : (
        <View style={styles.list}>
          {credits.length ? credits.map((account) => (
            <Pressable key={account.id} accessibilityRole="button" accessibilityLabel={`${account.customerName}, balance ${formatMoney(account.balanceCents)}, ${account.status === 'PAID' ? 'paid' : account.status === 'PARTIAL' ? 'partly paid' : 'unpaid'}. View details.`} onPress={() => view(account.id)} style={({ pressed }) => pressed && styles.pressed}>
              <Card style={styles.row}>
                <View style={styles.avatar}><MaterialCommunityIcons name="account-outline" size={26} color={colors.forest} /></View>
                <View style={styles.grow}><Text style={styles.name}>{account.customerName}</Text><Text style={styles.helper}>{formatDate(account.businessDate, { month: 'short', day: 'numeric' })} · {account.status === 'PAID' ? 'Paid' : account.status === 'PARTIAL' ? 'Partly paid' : 'Unpaid'}</Text></View>
                <Text style={[styles.rowBalance, account.status === 'PAID' && styles.paidBalance]}>{formatMoney(account.balanceCents)}</Text>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
              </Card>
            </Pressable>
          )) : <EmptyState icon="account-cash-outline" title="No customer credit records" message={filter === 'OPEN' ? 'There are no unpaid balances.' : 'Customer credit records will appear here.'} />}
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 29, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 15, marginTop: spacing.xs },
  summary: { backgroundColor: colors.mint, borderColor: colors.sage, alignItems: 'center', gap: 2 },
  summaryLabel: { color: colors.muted, fontSize: 14 },
  summaryValue: { color: colors.forest, fontSize: 31, fontWeight: '900' },
  filters: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, overflow: 'hidden' },
  filter: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  filterActive: { backgroundColor: colors.forest },
  filterText: { color: colors.text, fontWeight: '700' },
  filterTextActive: { color: colors.white },
  form: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  label: { color: colors.text, fontSize: 15, fontWeight: '800' },
  helper: { color: colors.muted, fontSize: 13, marginTop: 3 },
  list: { gap: spacing.sm },
  row: { padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1 },
  name: { color: colors.text, fontSize: 16, fontWeight: '800' },
  rowBalance: { color: colors.amber, fontSize: 17, fontWeight: '900' },
  paidBalance: { color: colors.forest },
  detail: { gap: spacing.md },
  detailTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  balance: { color: colors.amber, fontSize: 24, fontWeight: '900' },
  detailLine: { color: colors.text, fontSize: 15 },
  note: { color: colors.text, fontSize: 15, lineHeight: 21, padding: spacing.sm, backgroundColor: colors.mint, borderRadius: radii.sm },
  paymentForm: { gap: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderColor: colors.border },
  paid: { color: colors.forest, fontSize: 17, fontWeight: '800' },
  paymentRow: { minHeight: 45, borderBottomWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  paymentAmount: { color: colors.forest, fontSize: 16, fontWeight: '800' },
  detailActions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  pressed: { opacity: 0.72 },
});
