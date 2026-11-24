const DB_NAME = 'rigbench-tts-cache';
const DB_VERSION = 1;
const STORE_NAME = 'audio-clips';

interface CachedAudioRecord {
  key: string;
  blob: Blob;
  createdAt: number;
}

const MAX_MEMORY_CLIPS = 3;
const memoryFallback = new Map<string, Blob>();

function rememberAudioClip(key: string, blob: Blob): void {
  if (memoryFallback.has(key)) {
    memoryFallback.delete(key);
  }
  memoryFallback.set(key, blob);
  while (memoryFallback.size > MAX_MEMORY_CLIPS) {
    const oldestKey = memoryFallback.keys().next().value;
    if (oldestKey === undefined) break;
    memoryFallback.delete(oldestKey);
  }
}

function openCacheDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function buildAudioCacheKey(
  segmentId: string,
  personaId: string,
  scriptHash: string
): string {
  return `${segmentId}:${personaId}:${scriptHash}`;
}

export async function getCachedAudioClip(key: string): Promise<Blob | null> {
  const memHit = memoryFallback.get(key);
  if (memHit) {
    rememberAudioClip(key, memHit);
    return memHit;
  }

  const db = await openCacheDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const record = req.result as CachedAudioRecord | undefined;
        if (record?.blob instanceof Blob && record.blob.size > 0) {
          rememberAudioClip(key, record.blob);
          resolve(record.blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function setCachedAudioClip(key: string, blob: Blob): Promise<void> {
  if (!(blob instanceof Blob) || blob.size === 0) return;
  rememberAudioClip(key, blob);

  const db = await openCacheDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({
        key,
        blob,
        createdAt: Date.now(),
      } satisfies CachedAudioRecord);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
