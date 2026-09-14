import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Product, ProductInput } from '@/types';
import { AppButton } from './AppButton';
import { FormField } from './FormField';
import { colors, radii, spacing } from '@/theme';
import { parseMoneyToCents } from '@/utils';

interface ProductFormProps {
  initial?: Product | null;
  includeStartingStock: boolean;
  submitLabel: string;
  onSubmit: (input: ProductInput) => Promise<void>;
}

export function ProductForm({ initial, includeStartingStock, submitLabel, onSubmit }: ProductFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [imageUri, setImageUri] = useState<string | null>(initial?.imageUri ?? null);
  const [cost, setCost] = useState(initial ? String(initial.costPriceCents / 100) : '');
  const [price, setPrice] = useState(initial ? String(initial.sellingPriceCents / 100) : '');
  const [stock, setStock] = useState(initial ? String(initial.currentStock) : '');
  const [lowLevel, setLowLevel] = useState(initial ? String(initial.lowStockLevel) : '5');
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo permission needed', 'Allow photo access to choose a product picture. You can also continue without one.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const submit = async () => {
    const currentStock = includeStartingStock ? Number(stock) : initial?.currentStock ?? 0;
    const lowStockLevel = Number(lowLevel);
    if (!name.trim()) {
      Alert.alert('Enter a product name', 'Use the name you normally call this product.');
      return;
    }
    if (!Number.isInteger(currentStock) || currentStock < 0) {
      Alert.alert('Check the stock quantity', 'Enter a whole number that is zero or higher.');
      return;
    }
    if (!Number.isInteger(lowStockLevel) || lowStockLevel < 0) {
      Alert.alert('Check the low-stock alert', 'Enter a whole number that is zero or higher.');
      return;
    }
    const input: ProductInput = {
      name: name.trim(),
      imageUri,
      costPriceCents: parseMoneyToCents(cost),
      sellingPriceCents: parseMoneyToCents(price),
      currentStock,
      lowStockLevel,
    };
    if (input.sellingPriceCents <= 0) {
      Alert.alert('Enter a selling price', 'The selling price must be greater than zero.');
      return;
    }
    try {
      setSaving(true);
      await onSubmit(input);
    } catch (error) {
      Alert.alert('Product could not be saved', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={imageUri ? 'Change Product Photo' : 'Add Product Photo, optional'}
        onPress={pickImage}
        style={({ pressed }) => [styles.photo, pressed && styles.pressed]}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <MaterialCommunityIcons name="camera-plus-outline" size={34} color={colors.forest} />
        )}
        <Text style={styles.photoLabel}>{imageUri ? 'Change Product Photo' : 'Add Product Photo'}</Text>
        <Text style={styles.optional}>Optional</Text>
      </Pressable>

      <FormField label="Product Name" placeholder="Example: Coke Mismo" value={name} onChangeText={setName} autoCapitalize="words" />
      <FormField label="I bought it for" placeholder="₱0" value={cost} onChangeText={setCost} keyboardType="decimal-pad" hint="Cost for one item" />
      <FormField label="I sell it for" placeholder="₱0" value={price} onChangeText={setPrice} keyboardType="decimal-pad" hint="Selling price for one item" />
      {includeStartingStock ? (
        <FormField label="How many do I have?" placeholder="0" value={stock} onChangeText={setStock} keyboardType="number-pad" />
      ) : null}
      <FormField label="Tell me when only this many are left" placeholder="5" value={lowLevel} onChangeText={setLowLevel} keyboardType="number-pad" hint="This creates the Running Low warning." />
      <AppButton label={submitLabel} icon="content-save-outline" onPress={submit} loading={saving} />
      <Text style={styles.footer}>You can change these details later.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  photo: { alignSelf: 'center', width: 160, height: 150, borderRadius: radii.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.sage, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, overflow: 'hidden' },
  image: { position: 'absolute', width: '100%', height: '100%' },
  photoLabel: { color: colors.forest, fontSize: 15, fontWeight: '700', backgroundColor: 'rgba(255,255,255,0.88)', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.sm },
  optional: { color: colors.muted, fontSize: 12, backgroundColor: 'rgba(255,255,255,0.88)', paddingHorizontal: spacing.xs },
  footer: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  pressed: { opacity: 0.72 },
});
