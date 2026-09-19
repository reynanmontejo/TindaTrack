import { Directory, File, Paths } from 'expo-file-system';
import type { BackupPayload } from '@/types';

const imageDirectory = new Directory(Paths.document, 'product-images');

function ensureImageDirectory() {
  imageDirectory.create({ idempotent: true, intermediates: true });
}

export async function persistProductImage(sourceUri: string): Promise<string> {
  ensureImageDirectory();
  const source = new File(sourceUri);
  const extension = source.extension || '.jpg';
  const destination = new File(
    imageDirectory,
    `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`,
  );
  await source.copy(destination);
  return destination.uri;
}

export async function includeImagesInBackup(payload: BackupPayload): Promise<BackupPayload> {
  const files: NonNullable<BackupPayload['files']> = {};
  const products = payload.tables.products ?? [];
  for (const product of products) {
    const uri = typeof product.image_uri === 'string' ? product.image_uri : null;
    if (!uri || files[uri]) continue;
    try {
      const file = new File(uri);
      if (file.exists) files[uri] = { base64: await file.base64(), extension: file.extension || '.jpg' };
    } catch {
      // A missing optional photo should not prevent the business data backup.
    }
  }
  return { ...payload, files };
}

export function restoreImagesFromBackup(payload: BackupPayload): BackupPayload {
  if (!payload.files || !payload.tables.products) return payload;
  ensureImageDirectory();
  const uriMap = new Map<string, string>();
  for (const [oldUri, stored] of Object.entries(payload.files)) {
    try {
      const destination = new File(
        imageDirectory,
        `restored-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${stored.extension || '.jpg'}`,
      );
      destination.create({ overwrite: false, intermediates: true });
      destination.write(stored.base64, { encoding: 'base64' });
      uriMap.set(oldUri, destination.uri);
    } catch {
      // Keep the original URI if a single optional image cannot be restored.
    }
  }
  return {
    ...payload,
    tables: {
      ...payload.tables,
      products: payload.tables.products.map((product) => {
        const oldUri = typeof product.image_uri === 'string' ? product.image_uri : '';
        return { ...product, image_uri: uriMap.get(oldUri) ?? product.image_uri };
      }),
    },
  };
}
