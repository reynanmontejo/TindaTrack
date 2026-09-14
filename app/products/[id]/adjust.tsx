import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useAppData } from '@/data/AppDataContext';
import { colors, radii, spacing } from '@/theme';
import type { Product } from '@/types';

const reasons = ['Wrong count', 'Damaged', 'Expired', 'Personal use', 'Other'];

export default function AdjustStockScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Number(rawId);
  const { service, adjustStock } = useAppData();
  const [product, setProduct] = useState<Product | null>(null);
  const [actual, setActual] = useState('');
  const [reason, setReason] = useState('Wrong count');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    service?.getProduct(id).then((item) => {
      setProduct(item);
      if (item) setActual(String(item.currentStock));
    }).catch(console.error);
  }, [id, service]);

  if (!product) return <LoadingScreen label="Loading stock…" />;
  const actualNumber = Number(actual);
  const difference = Number.isFinite(actualNumber) ? actualNumber - product.currentStock : 0;

  const submit = async () => {
    if (!Number.isInteger(actualNumber) || actualNumber < 0) {
      Alert.alert('Check the actual stock', 'Enter a whole number that is zero or higher.');
      return;
    }
    if (actualNumber === product.currentStock) {
      Alert.alert('No change needed', `The app already shows ${product.currentStock}.`);
      return;
    }
    try {
      setSaving(true);
      await adjustStock(id, actualNumber, reason);
      Alert.alert('Stock updated', `${product.name} now has ${actualNumber} items.`, [{ text: 'Done', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('Stock could not be updated', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen>
      <Text style={styles.product}>{product.name}</Text>
      <Card style={styles.comparison}>
        <View style={styles.valueGroup}>
          <Text style={styles.label}>App says</Text>
          <Text style={styles.value}>{product.currentStock}</Text>
        </View>
        <MaterialCommunityIcons name="arrow-right" size={30} color={colors.forest} />
        <View style={styles.valueGroup}>
          <Text style={styles.label}>Actual number</Text>
          <TextInput
            accessibilityLabel="Actual stock number"
            value={actual}
            onChangeText={setActual}
            keyboardType="number-pad"
            selectTextOnFocus
            style={styles.actualInput}
          />
        </View>
      </Card>
      <View style={styles.changeNote}>
        <MaterialCommunityIcons
          name={difference >= 0 ? 'arrow-up-circle' : 'arrow-down-circle'}
          size={23}
          color={difference >= 0 ? colors.forest : colors.amber}
        />
        <Text style={styles.changeText}>
          {difference === 0 ? 'Stock will not change' : `Stock will ${difference > 0 ? 'increase' : 'decrease'} by ${Math.abs(difference)}`}
        </Text>
      </View>
      <View style={styles.reasons}>
        <Text style={styles.question}>Why are you changing it?</Text>
        {reasons.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="radio"
            accessibilityState={{ checked: reason === item }}
            onPress={() => setReason(item)}
            style={({ pressed }) => [styles.reasonRow, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons
              name={reason === item ? 'radiobox-marked' : 'radiobox-blank'}
              size={24}
              color={reason === item ? colors.forest : colors.muted}
            />
            <Text style={styles.reasonText}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <AppButton label={`Update Stock to ${Number.isFinite(actualNumber) ? actualNumber : 0}`} onPress={submit} loading={saving} />
      <Text style={styles.help}>This change will be saved in Stock History.</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  product: { color: colors.forest, fontSize: 18, fontWeight: '800' },
  comparison: { backgroundColor: colors.mint, borderColor: colors.sage, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  valueGroup: { alignItems: 'center', gap: spacing.xs },
  label: { color: colors.muted, fontSize: 14 },
  value: { color: colors.forest, fontSize: 36, fontWeight: '900' },
  actualInput: { minWidth: 88, minHeight: 54, backgroundColor: colors.white, borderRadius: radii.sm, borderWidth: 1.5, borderColor: colors.border, textAlign: 'center', color: colors.text, fontSize: 28, fontWeight: '800' },
  changeNote: { minHeight: 50, borderRadius: radii.sm, backgroundColor: colors.mint, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  changeText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  reasons: { gap: 0 },
  question: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: spacing.sm },
  reasonRow: { minHeight: 54, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reasonText: { color: colors.text, fontSize: 16 },
  help: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  pressed: { opacity: 0.72 },
});
