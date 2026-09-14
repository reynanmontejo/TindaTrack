import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { FormField } from '@/components/FormField';
import { useAppData } from '@/data/AppDataContext';
import { colors, spacing } from '@/theme';

export default function SettingsScreen() {
  const { storeName, updateStoreName } = useAppData();
  const [name, setName] = useState(storeName);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Enter your store name');
      return;
    }
    try {
      setSaving(true);
      await updateStoreName(name);
      Alert.alert('Store name saved');
    } catch (error) {
      Alert.alert('Setting could not be saved', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Store Information</Text>
        <FormField label="Store Name" value={name} onChangeText={setName} autoCapitalize="words" />
        <AppButton label="Save Store Name" icon="content-save-outline" onPress={save} loading={saving} />
      </View>
      <Card style={styles.info}>
        <MaterialCommunityIcons name="wifi-off" size={32} color={colors.forest} />
        <View style={styles.grow}>
          <Text style={styles.infoTitle}>Works Offline</Text>
          <Text style={styles.infoText}>Products, sales, stock, and notes are stored directly on this device.</Text>
        </View>
      </Card>
      <Card style={styles.info}>
        <MaterialCommunityIcons name="shield-check-outline" size={32} color={colors.forest} />
        <View style={styles.grow}>
          <Text style={styles.infoTitle}>History is Protected</Text>
          <Text style={styles.infoText}>Products are hidden instead of deleted, so old sales and profit records remain correct.</Text>
        </View>
      </Card>
      <View style={styles.about}>
        <Text style={styles.brand}>TindaTrack</Text>
        <Text style={styles.version}>Version 1.0.0 · Offline MVP</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  info: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  grow: { flex: 1 },
  infoTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: spacing.xs },
  infoText: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  about: { alignItems: 'center', paddingVertical: spacing.xl },
  brand: { color: colors.forest, fontSize: 24, fontWeight: '900' },
  version: { color: colors.muted, fontSize: 13, marginTop: spacing.xs },
});
