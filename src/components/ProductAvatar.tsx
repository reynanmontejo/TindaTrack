import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '@/theme';

export function ProductAvatar({ name, imageUri, size = 52 }: { name: string; imageUri?: string | null; size?: number }) {
  if (imageUri) {
    return <Image source={{ uri: imageUri }} style={{ width: size, height: size, borderRadius: radii.sm }} />;
  }
  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: radii.sm }]}>
      <MaterialCommunityIcons name="package-variant" size={Math.round(size * 0.45)} color={colors.forest} />
      <Text style={styles.initial} numberOfLines={1}>{name.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  initial: { position: 'absolute', opacity: 0, fontSize: 1 },
});
