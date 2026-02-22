/**
 * Whisper Model Manager — Native Platform (iOS/Android)
 *
 * Downloads and manages Whisper ExecuTorch (.pte) model files.
 * Files are stored in documentDirectory/whisper-stt/ for persistence.
 * Uses expo-file-system for real downloads with progress tracking.
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import {
  WHISPER_VARIANTS,
  DEFAULT_WHISPER_VARIANT,
  MIN_MODEL_FILE_SIZE,
  WHISPER_MODEL_DIR_NAME,
} from './config';
import type { WhisperVariantId } from './config';

const MODEL_DIR = `${FileSystem.documentDirectory}${WHISPER_MODEL_DIR_NAME}/`;

/** File that records which variant is currently stored */
const VARIANT_FILE = `${MODEL_DIR}variant.txt`;

// --- File names ---
const ENCODER_FILE = 'encoder.pte';
const DECODER_FILE = 'decoder.pte';
const TOKENIZER_FILE = 'tokenizer.json';

async function ensureModelDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(MODEL_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
  }
}

/**
 * Whether local Whisper inference is supported on the current platform.
 * Web never supports local models.
 */
export function isWhisperSupported(): boolean {
  return Platform.OS !== 'web';
}

/**
 * Get the currently downloaded variant, or null if none.
 */
export async function getDownloadedWhisperVariant(): Promise<WhisperVariantId | null> {
  try {
    if (!isWhisperSupported()) return null;
    const info = await FileSystem.getInfoAsync(VARIANT_FILE);
    if (!info.exists) return null;
    const content = await FileSystem.readAsStringAsync(VARIANT_FILE);
    const id = content.trim() as WhisperVariantId;
    return WHISPER_VARIANTS[id] ? id : null;
  } catch {
    return null;
  }
}

/**
 * Check if a file exists AND meets the minimum size threshold.
 * This prevents false positives from corrupt/empty downloads.
 */
async function fileExistsWithSize(
  path: string,
  minSize: number = 0,
): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return false;
    if (minSize > 0 && 'size' in info && typeof info.size === 'number') {
      return info.size >= minSize;
    }
    return info.exists;
  } catch {
    return false;
  }
}

/**
 * Check if all Whisper model files are downloaded and valid.
 * Verifies file existence AND minimum file sizes to prevent false positives.
 */
export async function checkWhisperModelExists(): Promise<boolean> {
  if (!isWhisperSupported()) return false;
  try {
    const [encoderOk, decoderOk, tokenizerOk] = await Promise.all([
      fileExistsWithSize(`${MODEL_DIR}${ENCODER_FILE}`, MIN_MODEL_FILE_SIZE),
      fileExistsWithSize(`${MODEL_DIR}${DECODER_FILE}`, MIN_MODEL_FILE_SIZE),
      fileExistsWithSize(`${MODEL_DIR}${TOKENIZER_FILE}`, 100), // tokenizer is small but must exist
    ]);
    return encoderOk && decoderOk && tokenizerOk;
  } catch {
    return false;
  }
}

/**
 * Get local file paths for the downloaded model.
 * Returns null if model is not downloaded.
 */
export async function getWhisperModelPaths(): Promise<{
  encoder: string;
  decoder: string;
  tokenizer: string;
} | null> {
  if (!isWhisperSupported()) return null;
  const exists = await checkWhisperModelExists();
  if (!exists) return null;
  return {
    encoder: `${MODEL_DIR}${ENCODER_FILE}`,
    decoder: `${MODEL_DIR}${DECODER_FILE}`,
    tokenizer: `${MODEL_DIR}${TOKENIZER_FILE}`,
  };
}

/**
 * Download Whisper model files from HuggingFace.
 * Downloads encoder, decoder, and tokenizer with combined progress reporting.
 *
 * @param onProgress - Progress callback (0 to 1)
 * @param variantId - Which model variant to download (default: small)
 */
export async function downloadWhisperModel(
  onProgress: (progress: number) => void,
  variantId: WhisperVariantId = DEFAULT_WHISPER_VARIANT,
): Promise<void> {
  const variant = WHISPER_VARIANTS[variantId];
  if (!variant) throw new Error(`Unknown Whisper variant: ${variantId}`);

  if (!isWhisperSupported()) {
    throw new Error('Local Whisper models are only supported on iOS and Android.');
  }

  // Clean up any existing model files first
  await deleteWhisperModel();
  await ensureModelDir();

  onProgress(0);
  console.log(`[WhisperModelManager] Downloading ${variant.name}...`);

  // Step 1: Download tokenizer (small, ~1 MB)
  console.log('[WhisperModelManager] Downloading tokenizer.json...');
  await FileSystem.downloadAsync(
    variant.urls.tokenizer,
    `${MODEL_DIR}${TOKENIZER_FILE}`,
  );
  onProgress(0.02);

  // Step 2: Download encoder (large, ~50% of total)
  console.log(`[WhisperModelManager] Downloading encoder (~${Math.round(variant.totalSizeMB * 0.5)} MB)...`);
  const encoderDownloader = FileSystem.createDownloadResumable(
    variant.urls.encoder,
    `${MODEL_DIR}${ENCODER_FILE}`,
    {},
    (dp) => {
      const p = dp.totalBytesWritten / dp.totalBytesExpectedToWrite;
      onProgress(0.02 + p * 0.49); // 2% to 51%
    },
  );
  const encoderResult = await encoderDownloader.downloadAsync();
  if (!encoderResult?.uri) {
    throw new Error('Encoder download failed — no file URI returned.');
  }

  // Step 3: Download decoder (large, ~50% of total)
  console.log(`[WhisperModelManager] Downloading decoder (~${Math.round(variant.totalSizeMB * 0.5)} MB)...`);
  const decoderDownloader = FileSystem.createDownloadResumable(
    variant.urls.decoder,
    `${MODEL_DIR}${DECODER_FILE}`,
    {},
    (dp) => {
      const p = dp.totalBytesWritten / dp.totalBytesExpectedToWrite;
      onProgress(0.51 + p * 0.49); // 51% to 100%
    },
  );
  const decoderResult = await decoderDownloader.downloadAsync();
  if (!decoderResult?.uri) {
    throw new Error('Decoder download failed — no file URI returned.');
  }

  // Verify files were actually downloaded with real content
  const [encoderOk, decoderOk, tokenizerOk] = await Promise.all([
    fileExistsWithSize(`${MODEL_DIR}${ENCODER_FILE}`, MIN_MODEL_FILE_SIZE),
    fileExistsWithSize(`${MODEL_DIR}${DECODER_FILE}`, MIN_MODEL_FILE_SIZE),
    fileExistsWithSize(`${MODEL_DIR}${TOKENIZER_FILE}`, 100),
  ]);

  if (!encoderOk || !decoderOk || !tokenizerOk) {
    // Clean up partial downloads
    await deleteWhisperModel();
    throw new Error(
      'Download verification failed — one or more model files are missing or too small. ' +
      'Please check your internet connection and try again.',
    );
  }

  // Record which variant was downloaded
  await FileSystem.writeAsStringAsync(VARIANT_FILE, variantId);

  onProgress(1);
  console.log(`[WhisperModelManager] ${variant.name} downloaded and verified.`);
}

/**
 * Delete all stored Whisper model files to free up storage.
 */
export async function deleteWhisperModel(): Promise<void> {
  if (!isWhisperSupported()) return;
  try {
    const info = await FileSystem.getInfoAsync(MODEL_DIR);
    if (info.exists) {
      await FileSystem.deleteAsync(MODEL_DIR, { idempotent: true });
    }
  } catch (error) {
    console.warn('[WhisperModelManager] Error deleting model files:', error);
  }
}

/**
 * Get the total size of downloaded model files in bytes.
 * Returns 0 if no model is downloaded.
 */
export async function getWhisperModelSize(): Promise<number> {
  if (!isWhisperSupported()) return 0;
  try {
    let total = 0;
    for (const file of [ENCODER_FILE, DECODER_FILE, TOKENIZER_FILE]) {
      const info = await FileSystem.getInfoAsync(`${MODEL_DIR}${file}`);
      if (info.exists && 'size' in info && typeof info.size === 'number') {
        total += info.size;
      }
    }
    return total;
  } catch {
    return 0;
  }
}
