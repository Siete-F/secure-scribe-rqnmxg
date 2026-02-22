/**
 * Whisper Model Manager — Web Stub
 *
 * Local Whisper models are not supported on web.
 * All functions return safe no-op values.
 */

import type { WhisperVariantId } from './config';

export function isWhisperSupported(): boolean {
  return false;
}

export async function getDownloadedWhisperVariant(): Promise<WhisperVariantId | null> {
  return null;
}

export async function checkWhisperModelExists(): Promise<boolean> {
  return false;
}

export async function getWhisperModelPaths(): Promise<null> {
  return null;
}

export async function downloadWhisperModel(
  _onProgress: (progress: number) => void,
  _variantId?: WhisperVariantId,
): Promise<void> {
  throw new Error('Local Whisper models are not supported on web.');
}

export async function deleteWhisperModel(): Promise<void> {
  // no-op
}

export async function getWhisperModelSize(): Promise<number> {
  return 0;
}
