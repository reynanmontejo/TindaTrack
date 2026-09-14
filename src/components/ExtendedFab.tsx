import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, shadows, spacing } from '@/theme';

export function ExtendedFab({ onPress }: { onPress: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add Sale"
      accessibilityHint="Opens the product list to record a new sale"
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { bottom: Math.max(insets.bottom, 8) + 74 },
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons name="plus" size={25} color={colors.white} />
      <Text style={styles.label}>Add Sale</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.lg,
    minHeight: 56,
    paddingHorizontal: 20,
    borderRadius: radii.pill,
    backgroundColor: colors.forest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    zIndex: 20,
    ...shadows.floating,
  },
  label: { color: colors.white, fontSize: 17, fontWeight: '700' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
