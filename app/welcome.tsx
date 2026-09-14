import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { FormField } from '@/components/FormField';
import { useAppData } from '@/data/AppDataContext';
import { colors, radii, spacing } from '@/theme';

export default function WelcomeScreen() {
  const { completeSetup } = useAppData();
  const [storeName, setStoreName] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!storeName.trim()) {
      Alert.alert('Enter your store name', 'This helps personalize your daily home screen.');
      return;
    }
    try {
      setSaving(true);
      await completeSetup(storeName);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Setup could not be saved', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <View style={styles.logo}>
        <MaterialCommunityIcons name="storefront-outline" size={52} color={colors.forest} />
      </View>
      <View style={styles.heading}>
        <Text style={styles.brand}>TindaTrack</Text>
        <Text style={styles.title}>Your simple digital store notebook</Text>
        <Text style={styles.subtitle}>
          Track products, stock, sales, and daily notes—even without internet.
        </Text>
      </View>
      <View style={styles.form}>
        <FormField
          label="What is your store name?"
          placeholder="Example: Aling Rosa's Store"
          value={storeName}
          onChangeText={setStoreName}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <AppButton label="Set Up My Store" icon="arrow-right" onPress={submit} loading={saving} />
        <Text style={styles.offline}>Your information stays on this device for this version.</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.xl },
  logo: {
    alignSelf: 'center',
    width: 92,
    height: 92,
    borderRadius: radii.lg,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { alignItems: 'center', gap: spacing.sm },
  brand: { color: colors.forest, fontSize: 34, fontWeight: '900' },
  title: { color: colors.text, fontSize: 24, lineHeight: 31, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: colors.muted, fontSize: 17, lineHeight: 25, textAlign: 'center' },
  form: { gap: spacing.lg },
  offline: { color: colors.muted, fontSize: 13, textAlign: 'center' },
});
