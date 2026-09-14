import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';

export function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '800', color: colors.text },
});
