import { db } from '../client';
import * as schema from '../schema';
import type { ApiKeys } from '@/types';

const LOCAL_USER_ID = 'local-user';

/** Get the raw API keys (full, unmasked) */
export async function getApiKeys(): Promise<ApiKeys> {
  const rows = await db.select().from(schema.apiKeys).limit(1);
  if (rows.length === 0) return {};
  const row = rows[0];
  return {
    openaiKey: row.openaiKey ?? undefined,
    geminiKey: row.geminiKey ?? undefined,
    mistralKey: row.mistralKey ?? undefined,
  };
}

/** Get masked API keys for UI display */
export async function getMaskedApiKeys(): Promise<ApiKeys> {
  const keys = await getApiKeys();
  return {
    openaiKey: keys.openaiKey ? maskKey(keys.openaiKey) : undefined,
    geminiKey: keys.geminiKey ? maskKey(keys.geminiKey) : undefined,
    mistralKey: keys.mistralKey ? maskKey(keys.mistralKey) : undefined,
  };
}

/** Save (upsert) API keys */
export async function saveApiKeys(keys: Partial<ApiKeys>): Promise<void> {
  const existingRows = await db.select().from(schema.apiKeys).limit(1);
  const existing = existingRows.length > 0 ? existingRows[0] : null;
  const now = new Date().toISOString();

  if (existing) {
    const updates: Record<string, any> = { updatedAt: now };
    if (keys.openaiKey !== undefined) updates.openaiKey = keys.openaiKey || null;
    if (keys.geminiKey !== undefined) updates.geminiKey = keys.geminiKey || null;
    if (keys.mistralKey !== undefined) updates.mistralKey = keys.mistralKey || null;

    await db.update(schema.apiKeys).set(updates);
  } else {
    await db.insert(schema.apiKeys).values({
      id: LOCAL_USER_ID,
      openaiKey: keys.openaiKey || null,
      geminiKey: keys.geminiKey || null,
      mistralKey: keys.mistralKey || null,
      createdAt: now,
      updatedAt: now,
    });
  }
}

function maskKey(key: string): string {
  if (key.length <= 4) return '****';
  return key.substring(0, 4) + '****';
}
