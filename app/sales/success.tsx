import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/AppButton';
import { useAppData } from '@/data/AppDataContext';
import { colors, radii, spacing } from '@/theme';
import type { SaleDetail } from '@/types';
import { formatMoney } from '@/utils';

export default function SaleSuccessScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Number(rawId);
  const { service, undoSale } = useAppData();
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [undoing, setUndoing] = useState(false);

  useEffect(() => {
    service?.getSale(id).then(setSale).catch(console.error);
  }, [id, service]);

  const undo = () => {
    Alert.alert('Undo this sale?', 'The sold items will be restored to stock and the sale will be removed from totals.', [
      { text: 'Keep Sale', style: 'cancel' },
      {
        text: 'Undo Sale',
        style: 'destructive',
        onPress: async () => {
          try {
            setUndoing(true);
            await undoSale(id);
            Alert.alert('Sale undone', 'The items have been restored to stock.', [
              { text: 'Done', onPress: () => router.replace('/(tabs)') },
            ]);
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.check}>
          <MaterialCommunityIcons name="check" size={58} color={colors.white} />
        </View>
        <Text style={styles.title}>Sale Saved!</Text>
        <Text style={styles.total}>{formatMoney(sale?.totalCents ?? 0)}</Text>
        <Text style={styles.message}>Stock has been updated automatically.</Text>
        <View style={styles.summary}>
          <MaterialCommunityIcons name="shopping-outline" size={24} color={colors.forest} />
          <Text style={styles.summaryText}>{sale?.itemCount ?? 0} {(sale?.itemCount ?? 0) === 1 ? 'item' : 'items'} sold</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <AppButton label="Done" onPress={() => router.replace('/(tabs)')} />
        <AppButton label="Undo This Sale" icon="undo-variant" variant="secondary" onPress={undo} loading={undoing} />
        <Text style={styles.helper}>Use Undo if the sale was entered by mistake.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  check: { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 33, fontWeight: '900', textAlign: 'center' },
  total: { color: colors.forest, fontSize: 52, fontWeight: '900' },
  message: { color: colors.text, fontSize: 18, lineHeight: 26, textAlign: 'center' },
  summary: { minHeight: 54, paddingHorizontal: spacing.lg, borderRadius: radii.md, backgroundColor: colors.mint, borderWidth: 1, borderColor: colors.sage, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  actions: { gap: spacing.sm },
  helper: { color: colors.muted, fontSize: 13, textAlign: 'center' },
});
