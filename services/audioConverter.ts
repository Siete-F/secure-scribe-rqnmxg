/**
 * Audio Converter — Native (iOS/Android)
 *
 * Converts audio files (M4A, etc.) to 16kHz mono WAV for local Whisper
 * transcription using ffmpeg-kit-react-native.
 *
 * The temporary WAV file is written to the cache directory and should be
 * deleted after transcription is complete.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';

/**
 * Convert an audio file (e.g. M4A/AAC) to a 16kHz mono WAV file.
 *
 * @param inputUri - Source audio file URI (file:// or absolute path)
 * @returns Absolute path to the converted WAV file in the cache directory
 * @throws Error if FFmpeg conversion fails
 */
export async function convertToWav(inputUri: string): Promise<string> {
  const inputPath = inputUri.startsWith('file://')
    ? inputUri.replace('file://', '')
    : inputUri;

  // Create a unique output path in the cache directory
  const outputPath = `${FileSystem.cacheDirectory}whisper_${Date.now()}.wav`;

  console.log(`[AudioConverter] Converting to WAV: ${inputPath}`);
  console.log(`[AudioConverter] Output: ${outputPath}`);

  // FFmpeg command: decode input → resample to 16kHz mono → output as PCM WAV
  const command = `-y -i "${inputPath}" -ar 16000 -ac 1 -c:a pcm_s16le -f wav "${outputPath}"`;

  const session = await FFmpegKit.execute(command);
  const returnCode = await session.getReturnCode();

  if (!ReturnCode.isSuccess(returnCode)) {
    const logs = await session.getAllLogsAsString();
    console.error('[AudioConverter] FFmpeg failed:', logs);
    throw new Error(
      `Audio conversion failed (code ${returnCode}). ` +
      'The recording format may not be supported for local transcription.',
    );
  }

  // Verify the output file exists
  const fileInfo = await FileSystem.getInfoAsync(outputPath);
  if (!fileInfo.exists) {
    throw new Error('Audio conversion produced no output file.');
  }

  console.log(`[AudioConverter] Conversion complete: ${(fileInfo.size / 1024).toFixed(0)} KB`);
  return outputPath;
}

/**
 * Delete a temporary WAV file created by convertToWav.
 * Silently ignores errors (file may already be gone).
 */
export async function deleteTempWav(wavPath: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(wavPath, { idempotent: true });
  } catch {
    // Ignore — cache files are cleaned up by the OS eventually
  }
}
