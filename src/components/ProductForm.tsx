import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Product, ProductInput } from '@/types';
import { AppButton } from './AppButton';
import { FormField } from './FormField';
import { colors, radii, spacing } from '@/theme';
import { persistProductImage } from '@/services/localFiles';
import { calculateUnitCost, parseMoneyToCents } from '@/utils';

interface ProductFormProps {
  initial?: Product | null;
  includeStartingStock: boolean;
  submitLabel: string;
  onSubmit: (input: ProductInput) => Promise<void>;
}

export function ProductForm({ initial, includeStartingStock, submitLabel, onSubmit }: ProductFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [imageUri, setImageUri] = useState<string | null>(initial?.imageUri ?? null);
  const [category, setCategory] = useState(initial?.category ?? '');
  const [unitsPerPack, setUnitsPerPack] = useState(String(initial?.unitsPerPack ?? 1));
  const [packName, setPackName] = useState(initial?.packName ?? 'pack');
  const [unitName, setUnitName] = useState(initial?.unitName ?? 'piece');
  const [usePackSetup, setUsePackSetup] = useState((initial?.unitsPerPack ?? 1) > 1);
  const [cost, setCost] = useState(initial ? String((initial.costPriceCents * initial.unitsPerPack) / 100) : '');
  const [price, setPrice] = useState(initial ? String(initial.sellingPriceCents / 100) : '');
  const [stock, setStock] = useState(initial ? String(initial.currentStock) : '');
  const [lowLevel, setLowLevel] = useState(initial ? String(initial.lowStockLevel) : '5');
  const [saving, setSaving] = useState(false);

  const savePickedImage = async (uri: string) => {
    try {
      setImageUri(await persistProductImage(uri));
    } catch {
      Alert.alert('Photo could not be saved', 'Please try taking or choosing the photo again.');
    }
  };

  const chooseFromLibrary = async () => {
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
    if (!result.canceled) await savePickedImage(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'Allow camera access to take a product picture. You can also continue without one.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });
    if (!result.canceled) await savePickedImage(result.assets[0].uri);
  };

  const choosePhoto = () => {
    const choices = [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: chooseFromLibrary },
      ...(imageUri ? [{ text: 'Remove Photo', style: 'destructive' as const, onPress: () => setImageUri(null) }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ];
    Alert.alert('Product Photo', 'Choose how to add the product picture.', choices);
  };

  const submit = async () => {
    const currentStock = includeStartingStock ? Number(stock) : initial?.currentStock ?? 0;
    const lowStockLevel = Number(lowLevel);
    const packSize = usePackSetup ? Number(unitsPerPack) : 1;
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
    if (!Number.isInteger(packSize) || packSize <= 0) {
      Alert.alert('Check the pack quantity', 'Enter how many sellable units are inside one pack. Use 1 if you do not sell by tingi.');
      return;
    }
    const purchaseCostCents = parseMoneyToCents(cost);
    const input: ProductInput = {
      name: name.trim(),
      imageUri,
      category: category.trim() || null,
      costPriceCents: calculateUnitCost(purchaseCostCents, packSize),
      sellingPriceCents: parseMoneyToCents(price),
      currentStock,
      lowStockLevel,
      unitsPerPack: packSize,
      packName: usePackSetup ? packName.trim() || 'pack' : 'item',
      unitName: usePackSetup ? unitName.trim() || 'piece' : 'piece',
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
        onPress={choosePhoto}
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
      <FormField label="Category" placeholder="Example: Drinks" value={category} onChangeText={setCategory} autoCapitalize="words" hint="Optional. Helps organize a long product list." />
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: usePackSetup }} onPress={() => setUsePackSetup((value) => !value)} style={styles.packToggle}>
        <MaterialCommunityIcons name={usePackSetup ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'} size={27} color={colors.forest} />
        <View style={styles.packToggleText}>
          <Text style={styles.unitTitle}>I buy this in packs and sell it by tingi</Text>
          <Text style={styles.unitHelp}>Example: buy one case, sell each bottle.</Text>
        </View>
      </Pressable>
      {usePackSetup ? (
        <View style={styles.unitCard}>
          <Text style={styles.unitTitle}>Pack or tingi setup</Text>
          <FormField label="What do you buy?" placeholder="pack, case, box" value={packName} onChangeText={setPackName} autoCapitalize="none" />
          <FormField label="What do you sell?" placeholder="piece, bottle, sachet" value={unitName} onChangeText={setUnitName} autoCapitalize="none" />
          <FormField label={`How many ${unitName || 'pieces'} are in one ${packName || 'pack'}?`} placeholder="1" value={unitsPerPack} onChangeText={(value) => setUnitsPerPack(value.replace(/[^0-9]/g, ''))} keyboardType="number-pad" inputMode="numeric" returnKeyType="done" />
        </View>
      ) : null}
      <FormField label={usePackSetup ? `I bought one ${packName || 'pack'} for` : 'I bought it for'} placeholder="₱0" value={cost} onChangeText={setCost} keyboardType="decimal-pad" inputMode="decimal" returnKeyType="done" hint={usePackSetup ? `The app calculates the cost for each ${unitName || 'piece'} automatically.` : 'Cost for one item'} />
      <FormField label={usePackSetup ? `I sell one ${unitName || 'piece'} for` : 'I sell it for'} placeholder="₱0" value={price} onChangeText={setPrice} keyboardType="decimal-pad" inputMode="decimal" returnKeyType="done" hint="Selling price for one sellable unit" />
      {includeStartingStock ? (
        <FormField label="How many do I have?" placeholder="0" value={stock} onChangeText={setStock} keyboardType="number-pad" inputMode="numeric" returnKeyType="done" />
      ) : null}
      <FormField label="Tell me when only this many are left" placeholder="5" value={lowLevel} onChangeText={setLowLevel} keyboardType="number-pad" inputMode="numeric" returnKeyType="done" hint="This creates the Running Low warning." />
      <AppButton label={submitLabel} icon="content-save-outline" onPress={submit} loading={saving} />
      <Text style={styles.footer}>You can change these details later.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  unitCard: { gap: spacing.md, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.mint, borderWidth: 1, borderColor: colors.sage },
  packToggle: { minHeight: 70, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  packToggleText: { flex: 1, gap: 2 },
  unitTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  unitHelp: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  photo: { alignSelf: 'center', width: 160, height: 150, borderRadius: radii.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.sage, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, overflow: 'hidden' },
  image: { position: 'absolute', width: '100%', height: '100%' },
  photoLabel: { color: colors.forest, fontSize: 15, fontWeight: '700', backgroundColor: 'rgba(255,255,255,0.88)', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.sm },
  optional: { color: colors.muted, fontSize: 12, backgroundColor: 'rgba(255,255,255,0.88)', paddingHorizontal: spacing.xs },
  footer: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  pressed: { opacity: 0.72 },
});
