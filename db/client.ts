import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const DATABASE_NAME = 'safetranscript.db';

const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

// Enable WAL mode for better concurrent read performance
expoDb.execSync('PRAGMA journal_mode = WAL;');
expoDb.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expoDb, { schema });

/**
 * Create tables if they don't exist. Called once at app startup.
 */
export async function initializeDatabase() {
  expoDb.execSync(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      llm_provider TEXT NOT NULL,
      llm_model TEXT NOT NULL,
      llm_prompt TEXT NOT NULL,
      enable_anonymization INTEGER NOT NULL DEFAULT 1,
      custom_fields TEXT,
      sensitive_words TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recordings (
      id TEXT PRIMARY KEY NOT NULL,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      audio_path TEXT,
      audio_duration INTEGER,
      custom_field_values TEXT,
      transcription TEXT,
      transcription_data TEXT,
      anonymized_transcription TEXT,
      pii_mappings TEXT,
      llm_output TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY NOT NULL,
      openai_key TEXT,
      gemini_key TEXT,
      mistral_key TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
}
