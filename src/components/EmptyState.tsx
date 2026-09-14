import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme';

export function EmptyState({
  icon,
  title,
  message,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  message: string;
}) {
  return (
    <View style={styles.wrap}>
      <MaterialCommunityIcons name={icon} size={52} color={colors.green} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: spacing.xl, gap: spacing.sm },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  message: { fontSize: 16, lineHeight: 23, color: colors.muted, textAlign: 'center' },
});
