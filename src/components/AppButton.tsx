import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors, radii, spacing } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'text';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function AppButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  accessibilityHint,
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const foreground = variant === 'primary'
    ? colors.white
    : variant === 'danger'
      ? colors.danger
      : colors.forest;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon ? <MaterialCommunityIcons name={icon} size={23} color={foreground} /> : null}
          <Text style={[styles.label, { color: foreground }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1.5,
  },
  primary: { backgroundColor: colors.forest, borderColor: colors.forest },
  secondary: { backgroundColor: colors.white, borderColor: colors.forest },
  danger: { backgroundColor: colors.white, borderColor: colors.danger },
  text: { backgroundColor: 'transparent', borderColor: 'transparent' },
  label: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
