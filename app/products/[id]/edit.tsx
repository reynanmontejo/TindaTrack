import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { AppScreen } from '@/components/AppScreen';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ProductForm } from '@/components/ProductForm';
import { useAppData } from '@/data/AppDataContext';
import type { Product } from '@/types';

export default function EditProductScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Number(rawId);
  const { service, updateProduct } = useAppData();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    service?.getProduct(id).then(setProduct).catch(console.error);
  }, [id, service]);

  if (!product) return <LoadingScreen label="Loading product…" />;
  return (
    <AppScreen>
      <ProductForm
        initial={product}
        includeStartingStock={false}
        submitLabel="Save Product Changes"
        onSubmit={async (input) => {
          await updateProduct(id, input);
          router.back();
        }}
      />
    </AppScreen>
  );
}
