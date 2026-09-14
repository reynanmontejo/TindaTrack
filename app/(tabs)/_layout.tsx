import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import React from 'react';
import { colors } from '@/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.text,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginBottom: 5 },
        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          backgroundColor: colors.white,
          borderTopColor: colors.border,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home-variant" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Sell',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cart-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="stock"
        options={{
          title: 'Stock',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="package-variant-closed" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="daily-note"
        options={{
          title: 'Daily Note',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="notebook-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="sales-history" options={{ href: null }} />
      <Tabs.Screen name="insights" options={{ href: null }} />
    </Tabs>
  );
}
