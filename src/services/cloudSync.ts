import type { BackupPayload } from '@/types';

/** Provider-neutral boundary for a future authenticated cloud service. */
export interface CloudSyncProvider {
  upload(payload: BackupPayload): Promise<{ remoteId: string; uploadedAt: string }>;
  downloadLatest(): Promise<BackupPayload | null>;
}

export interface SyncResult {
  direction: 'UPLOAD' | 'DOWNLOAD' | 'NO_REMOTE_DATA';
  timestamp: string;
  remoteId?: string;
}

export async function uploadBackupToProvider(
  payload: BackupPayload,
  provider: CloudSyncProvider,
): Promise<SyncResult> {
  const result = await provider.upload(payload);
  return { direction: 'UPLOAD', timestamp: result.uploadedAt, remoteId: result.remoteId };
}

export async function downloadBackupFromProvider(
  provider: CloudSyncProvider,
): Promise<{ result: SyncResult; payload: BackupPayload | null }> {
  const payload = await provider.downloadLatest();
  return {
    result: { direction: payload ? 'DOWNLOAD' : 'NO_REMOTE_DATA', timestamp: new Date().toISOString() },
    payload,
  };
}
