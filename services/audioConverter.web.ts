/**
 * Audio Converter — Web stub
 *
 * Local Whisper transcription is not supported on web,
 * so audio conversion is not needed.
 */

export async function convertToWav(_inputUri: string): Promise<string> {
  throw new Error('Audio conversion is not supported on web.');
}

export async function deleteTempWav(_wavPath: string): Promise<void> {
  // No-op on web
}
