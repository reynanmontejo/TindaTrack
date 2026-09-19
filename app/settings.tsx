import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { FormField } from '@/components/FormField';
import { useAppData } from '@/data/AppDataContext';
import { chooseBackupFile, prepareBackupForRestore, shareBackup } from '@/services/backup';
import { colors, spacing } from '@/theme';

export default function SettingsScreen() {
  const { storeName, updateStoreName, service, restoreBackup } = useAppData();
  const [name, setName] = useState(storeName);
  const [saving, setSaving] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);

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

  const createBackup = async () => {
    if (!service) return;
    try {
      setBackupBusy(true);
      await shareBackup(await service.exportBackup());
      Alert.alert('Backup ready', 'Save the file somewhere safe, such as Files or Google Drive.');
    } catch (error) {
      Alert.alert('Backup could not be created', error instanceof Error ? error.message : 'Please try again.');
    } finally { setBackupBusy(false); }
  };

  const chooseRestore = async () => {
    try {
      setBackupBusy(true);
      const payload = await chooseBackupFile();
      if (!payload) return;
      Alert.alert('Replace all current data?', 'Restoring will replace the products, sales, stock, expenses, utang, and notes currently on this phone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore Backup',
          style: 'destructive',
          onPress: async () => {
            try {
              await restoreBackup(prepareBackupForRestore(payload));
              Alert.alert('Backup restored', 'TindaTrack now uses the restored data.');
            } catch (error) {
              Alert.alert('Backup could not be restored', error instanceof Error ? error.message : 'Please check the file.');
            }
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Backup file could not be opened', error instanceof Error ? error.message : 'Please choose a valid TindaTrack backup.');
    } finally { setBackupBusy(false); }
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
          <Text style={styles.infoText}>Products, sales, stock, expenses, utang, and notes are stored directly on this device.</Text>
        </View>
      </Card>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backup & Restore</Text>
        <Text style={styles.infoText}>Backups include products, photos, sales, stock history, expenses, utang, and daily notes.</Text>
        <AppButton label="Create Backup File" icon="cloud-upload-outline" onPress={createBackup} loading={backupBusy} />
        <AppButton label="Restore from Backup" icon="backup-restore" variant="secondary" onPress={chooseRestore} disabled={backupBusy} />
        <Text style={styles.caution}>Restore replaces the data currently stored on this phone. TindaTrack always asks for confirmation first.</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usability Test</Text>
        <Text style={styles.infoText}>Use the guided checklist with a real store owner before introducing the app in daily operations.</Text>
        <AppButton label="Open Test Checklist" icon="clipboard-check-outline" variant="secondary" onPress={() => router.push('/usability-test')} />
      </View>
      <Card style={styles.info}>
        <MaterialCommunityIcons name="shield-check-outline" size={32} color={colors.forest} />
        <View style={styles.grow}>
          <Text style={styles.infoTitle}>History is Protected</Text>
          <Text style={styles.infoText}>Products are hidden instead of deleted, so old sales and profit records remain correct.</Text>
        </View>
      </Card>
      <View style={styles.about}>
        <Text style={styles.brand}>TindaTrack</Text>
        <Text style={styles.version}>Version 1.1.0 · Expanded Offline MVP</Text>
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
  caution: { color: colors.amber, fontSize: 12, lineHeight: 18 },
  about: { alignItems: 'center', paddingVertical: spacing.xl },
  brand: { color: colors.forest, fontSize: 24, fontWeight: '900' },
  version: { color: colors.muted, fontSize: 13, marginTop: spacing.xs },
});
