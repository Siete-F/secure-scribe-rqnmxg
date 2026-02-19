/**
 * Audio file storage service
 * Manages persistent local audio files using expo-file-system
 */
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const AUDIO_DIR = 'audio/';

/** Get the full path to the audio directory, creating it if needed */
export async function getAudioDirectory(): Promise<string> {
  if (Platform.OS === 'web') {
    // On web, we don't have a real filesystem — audio stays as blob URLs or in IndexedDB
    return '';
  }
  const dir = `${FileSystem.documentDirectory}${AUDIO_DIR}`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

/**
 * Save an audio file from a temporary URI to persistent storage
 * @returns The relative audio path (for storing in DB)
 */
export async function saveAudioFile(recordingId: string, sourceUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    // On web, store the blob URL directly — it persists for the session
    // For true persistence, would need IndexedDB, but blob URLs work for now
    return sourceUri;
  }

  const dir = await getAudioDirectory();
  const extension = getExtension(sourceUri);
  const relativePath = `${AUDIO_DIR}${recordingId}.${extension}`;
  const destUri = `${FileSystem.documentDirectory}${relativePath}`;

  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  console.log(`[AudioStorage] Saved audio: ${relativePath}`);
  return relativePath;
}

/** Get the full file:// URI for a stored audio file */
export function getAudioFileUri(audioPath: string): string {
  if (Platform.OS === 'web' || audioPath.startsWith('http') || audioPath.startsWith('blob:') || audioPath.startsWith('file:')) {
    return audioPath;
  }
  return `${FileSystem.documentDirectory}${audioPath}`;
}

/** Delete a stored audio file */
export async function deleteAudioFile(audioPath: string): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const uri = getAudioFileUri(audioPath);
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri);
      console.log(`[AudioStorage] Deleted: ${audioPath}`);
    }
  } catch (error) {
    console.warn(`[AudioStorage] Failed to delete ${audioPath}:`, error);
  }
}

function getExtension(uri: string): string {
  const supported = ['m4a', 'mp3', 'wav', 'caf', 'aac'];
  const match = uri.match(/\.(\w+)(?:\?.*)?$/);
  const ext = match?.[1]?.toLowerCase();
  return ext && supported.includes(ext) ? ext : 'm4a';
}
