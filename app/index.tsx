import { Redirect } from 'expo-router';
import React from 'react';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useAppData } from '@/data/AppDataContext';

export default function IndexScreen() {
  const { ready, setupComplete } = useAppData();
  if (!ready) return <LoadingScreen />;
  return <Redirect href={setupComplete ? '/(tabs)' : '/welcome'} />;
}
