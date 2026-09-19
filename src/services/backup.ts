import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { BackupPayload } from '@/types';
import { includeImagesInBackup, restoreImagesFromBackup } from './localFiles';

export async function shareBackup(payload: BackupPayload): Promise<string> {
  const completePayload = await includeImagesInBackup(payload);
  const date = completePayload.exportedAt.slice(0, 10);
  const file = new File(Paths.cache, `TindaTrack-backup-${date}.json`);
  file.create({ overwrite: true, intermediates: true });
  file.write(JSON.stringify(completePayload));
  if (!(await Sharing.isAvailableAsync())) throw new Error('File sharing is not available on this device.');
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save or share TindaTrack backup',
    UTI: 'public.json',
  });
  return file.uri;
}

export async function chooseBackupFile(): Promise<BackupPayload | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/json', 'text/plain'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const text = await new File(result.assets[0].uri).text();
  const parsed = JSON.parse(text) as BackupPayload;
  if (parsed?.format !== 'TINDATRACK_BACKUP' || !parsed.tables) throw new Error('This is not a TindaTrack backup file.');
  return parsed;
}

export function prepareBackupForRestore(payload: BackupPayload): BackupPayload {
  return restoreImagesFromBackup(payload);
}
