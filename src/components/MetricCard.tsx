import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '@/theme';

export function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}) {
  return (
    <View style={styles.card} accessible accessibilityLabel={`${label}: ${value}`}>
      <MaterialCommunityIcons name={icon} size={23} color={colors.forest} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 128,
    borderRadius: radii.md,
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: colors.sage,
    padding: spacing.md,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  label: { fontSize: 15, color: colors.text, lineHeight: 20 },
  value: { fontSize: 29, lineHeight: 35, fontWeight: '800', color: colors.forest },
});
