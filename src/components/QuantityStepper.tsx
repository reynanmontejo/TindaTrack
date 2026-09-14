import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '@/theme';

export function QuantityStepper({
  value,
  onChange,
  minimum = 0,
  maximum = Number.MAX_SAFE_INTEGER,
}: {
  value: number;
  onChange: (value: number) => void;
  minimum?: number;
  maximum?: number;
}) {
  return (
    <View style={styles.row} accessibilityLabel={`Quantity ${value}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        disabled={value <= minimum}
        onPress={() => onChange(Math.max(minimum, value - 1))}
        style={({ pressed }) => [styles.button, value <= minimum && styles.disabled, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="minus" size={25} color={colors.forest} />
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        disabled={value >= maximum}
        onPress={() => onChange(Math.min(maximum, value + 1))}
        style={({ pressed }) => [styles.button, value >= maximum && styles.disabled, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="plus" size={25} color={colors.forest} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  button: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  value: { minWidth: 42, textAlign: 'center', fontSize: 24, fontWeight: '800', color: colors.text },
  disabled: { opacity: 0.35 },
  pressed: { backgroundColor: colors.mint },
});
