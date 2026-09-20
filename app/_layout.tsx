import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AppDataProvider } from '@/data/AppDataContext';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <AppDataProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.forest,
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="sales/cart" options={{ title: 'Your Sale' }} />
        <Stack.Screen name="sales/success" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="sales/[id]" options={{ title: 'Sale Details' }} />
        <Stack.Screen name="sales/edit" options={{ title: 'Edit Sale' }} />
        <Stack.Screen name="stock/add" options={{ title: 'Choose Product' }} />
        <Stack.Screen name="finance" options={{ title: 'Expenses & Cash' }} />
        <Stack.Screen name="utang" options={{ title: 'Customer Credit' }} />
        <Stack.Screen name="usability-test" options={{ title: 'Usability Test' }} />
        <Stack.Screen name="products/add" options={{ title: 'Add Product' }} />
        <Stack.Screen name="products/hidden" options={{ title: 'Hidden Products' }} />
        <Stack.Screen name="products/[id]/index" options={{ title: 'Product Details' }} />
        <Stack.Screen name="products/[id]/edit" options={{ title: 'Edit Product' }} />
        <Stack.Screen name="products/[id]/restock" options={{ title: 'Add Stock' }} />
        <Stack.Screen name="products/[id]/adjust" options={{ title: 'Change Stock Count' }} />
        <Stack.Screen name="products/[id]/history" options={{ title: 'Stock History' }} />
        <Stack.Screen name="day/[date]" options={{ title: 'Past Day' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </AppDataProvider>
  );
}
