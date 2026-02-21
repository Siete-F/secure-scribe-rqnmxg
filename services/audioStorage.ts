/**
 * Audio file storage service
 *
 * On native (iOS/Android) audio is saved into the project's recordings/
 * folder via the fileStorage service. The composite recording ID
 * "{projectFolder}::{timestamp}" is used to derive the destination path.
 *
 * On web, audio stays as blob URLs for the session (no real filesystem).
 */
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import * as FileStorage from './fileStorage';

/** Get the full path to the audio directory (legacy, used sparingly) */
export async function getAudioDirectory(): Promise<string> {
  if (Platform.OS === 'web') {
    return '';
  }
  return FileStorage.getStorageRoot();
}

/**
 * Save an audio file from a temporary URI to persistent storage.
 * @param recordingId  Composite ID ("{projectFolder}::{timestamp}") on native,
 *                     or a plain UUID on web.
 * @param sourceUri    The temporary recording URI to copy from.
 * @returns The full audio file path (for storing in recording metadata).
 */
export async function saveAudioFile(recordingId: string, sourceUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    // On web, store the blob URL directly — it persists for the session
    return sourceUri;
  }

  const { projectFolder, timestamp } = FileStorage.parseRecordingId(recordingId);
  const destPath = await FileStorage.saveAudio(projectFolder, timestamp, sourceUri);
  console.log(`[AudioStorage] Saved audio: ${destPath}`);
  return destPath;
}

/** Get the full file:// URI for a stored audio file */
export function getAudioFileUri(audioPath: string): string {
  if (
    Platform.OS === 'web' ||
    audioPath.startsWith('http') ||
    audioPath.startsWith('blob:') ||
    audioPath.startsWith('file:')
  ) {
    return audioPath;
  }
  // If the path is already absolute (starts with /), just prefix with file://
  if (audioPath.startsWith('/')) {
    return `file://${audioPath}`;
  }
  // Legacy relative path support
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
