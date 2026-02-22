/**
 * Local Model Manager
 *
 * Manages on-device transcription model (Whisper via ExecuTorch).
 * This module delegates to the whisper/ sub-module for actual model
 * management and provides backward-compatible exports for the Settings UI.
 *
 * Web is not supported: all helpers return safe no-op values.
 *
 * IMPORTANT – New Architecture required:
 *   react-native-executorch needs Fabric / TurboModules.
 *   Users must create a Development Build (`npx expo run:ios` or `run:android`).
 *   Expo Go will NOT work.
 */

import type { WhisperVariantId } from './whisper/config';

import {
  isWhisperSupported,
  checkWhisperModelExists,
  downloadWhisperModel,
  deleteWhisperModel,
} from './whisper/WhisperModelManager';

// Re-export whisper-specific functions for Settings UI
export {
  isWhisperSupported,
  checkWhisperModelExists,
  downloadWhisperModel,
  deleteWhisperModel,
  getDownloadedWhisperVariant,
  getWhisperModelSize,
} from './whisper/WhisperModelManager';

// Re-export config types and constants
export {
  WHISPER_VARIANTS,
  DEFAULT_WHISPER_VARIANT,
} from './whisper/config';
export type { WhisperVariantId } from './whisper/config';

/**
 * Whether local inference is supported on the current platform.
 * Backward-compatible alias for isWhisperSupported().
 */
export const isLocalModelSupported = (): boolean => {
  return isWhisperSupported();
};

/**
 * Check whether the local model files exist on disk.
 * Backward-compatible alias for checkWhisperModelExists().
 */
export const checkModelExists = async (): Promise<boolean> => {
  return checkWhisperModelExists();
};

/**
 * Download the local model, reporting progress via `onProgress` (0 → 1).
 * @param onProgress Progress callback (0 to 1)
 * @param variantId Which Whisper variant to download
 */
export const downloadModel = async (
  onProgress: (progress: number) => void,
  variantId?: WhisperVariantId,
): Promise<string | null> => {
  await downloadWhisperModel(onProgress, variantId);
  return 'downloaded';
};

/**
 * Delete the local model files to free up storage.
 */
export const deleteModel = async (): Promise<void> => {
  return deleteWhisperModel();
};

/**
 * Basic device capability check.
 * Returns true on native platforms (optimistic — inference failures
 * are caught at runtime).
 */
export const hasEnoughMemory = async (): Promise<boolean> => {
  return isLocalModelSupported();
};

/** Minimum RAM (bytes) suggested for local inference. */
export const MINIMUM_RAM_BYTES = 4 * 1024 * 1024 * 1024; // 4 GB for Whisper
