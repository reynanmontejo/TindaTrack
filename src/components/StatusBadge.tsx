import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ProductStatus } from '@/types';
import { colors, radii, spacing } from '@/theme';

const labels: Record<ProductStatus, string> = {
  AVAILABLE: 'Available',
  LOW: 'Running Low',
  OUT: 'Out of Stock',
};

export function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <View style={[styles.badge, status === 'LOW' && styles.low, status === 'OUT' && styles.out]}>
      <Text style={[styles.text, status === 'LOW' && styles.lowText, status === 'OUT' && styles.outText]}>
        {labels[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radii.pill, backgroundColor: colors.mint },
  low: { backgroundColor: colors.amberSoft },
  out: { backgroundColor: '#ECEFED' },
  text: { color: colors.forest, fontSize: 13, fontWeight: '700' },
  lowText: { color: colors.amber },
  outText: { color: colors.muted },
});
