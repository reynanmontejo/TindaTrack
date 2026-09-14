import { router } from 'expo-router';
import React from 'react';
import { AppScreen } from '@/components/AppScreen';
import { ProductForm } from '@/components/ProductForm';
import { useAppData } from '@/data/AppDataContext';

export default function AddProductScreen() {
  const { addProduct } = useAppData();
  return (
    <AppScreen>
      <ProductForm
        includeStartingStock
        submitLabel="Save Product"
        onSubmit={async (input) => {
          const id = await addProduct(input);
          router.replace(`/products/${id}`);
        }}
      />
    </AppScreen>
  );
}
