import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppData } from '@/data/AppDataContext';
import { colors, radii, shadows, spacing } from '@/theme';

interface QuickActionFabProps {
  onAddSale: () => void;
  onAddStock: () => void;
}

export function QuickActionFab({ onAddSale, onAddStock }: QuickActionFabProps) {
  const pathname = usePathname();
  const { cartCount } = useAppData();
  const [open, setOpen] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () => {
      setOpen(false);
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  if (keyboardVisible || (pathname.endsWith('/sell') && cartCount > 0)) return null;

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      {open ? (
        <View accessibilityRole="menu" style={styles.menu}>
          <Pressable
            accessibilityRole="menuitem"
            accessibilityLabel="Add Sale"
            accessibilityHint="Choose products and quantities for a new sale"
            onPress={() => run(onAddSale)}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <View style={styles.actionIcon}>
              <MaterialCommunityIcons name="cart-plus" size={22} color={colors.forest} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Add Sale</Text>
              <Text style={styles.actionHelp}>Choose products and quantity</Text>
            </View>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            accessibilityRole="menuitem"
            accessibilityLabel="Add Stock"
            accessibilityHint="Choose a product to restock"
            onPress={() => run(onAddStock)}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <View style={styles.actionIcon}>
              <MaterialCommunityIcons name="package-variant-plus" size={22} color={colors.forest} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Add Stock</Text>
              <Text style={styles.actionHelp}>Choose a product to restock</Text>
            </View>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.fabRow}>
        {!open ? <Text pointerEvents="none" style={styles.addLabel}>Add</Text> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={open ? 'Close quick actions' : 'Add sale or stock'}
          accessibilityHint="Shows Add Sale and Add Stock"
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen((value) => !value)}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        >
          <MaterialCommunityIcons name={open ? 'close' : 'plus'} size={31} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 78,
    zIndex: 30,
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  menu: {
    width: 278,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    overflow: 'hidden',
    ...shadows.floating,
  },
  action: {
    minHeight: 72,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  actionHelp: { color: colors.muted, fontSize: 14, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 66 },
  fabRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  addLabel: { color: colors.forest, fontSize: 15, fontWeight: '800', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...shadows.card },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.floating,
  },
  pressed: { backgroundColor: colors.mint },
  fabPressed: { backgroundColor: colors.forestDark, transform: [{ scale: 0.96 }] },
});
