/**
 * WAV Audio Utilities
 *
 * Parses WAV files recorded by expo-audio to extract raw PCM samples
 * as Float32Array suitable for Whisper inference (16kHz, mono).
 *
 * Supports standard PCM WAV files (RIFF header).
 */

import * as FileSystem from 'expo-file-system/legacy';

/**
 * Read a WAV file and return its raw PCM data as a Float32Array.
 * The samples are normalized to the range [-1.0, 1.0].
 *
 * @param fileUri - Full file URI (file:// or absolute path)
 * @returns Float32Array of normalized audio samples
 * @throws Error if the file is not a valid WAV with PCM data
 */
export async function readWavAsFloat32(fileUri: string): Promise<Float32Array> {
  // Read the file as base64
  const uri = fileUri.startsWith('file://') ? fileUri : `file://${fileUri}`;
  const base64Data = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Decode base64 to byte array
  const binaryStr = atob(base64Data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.codePointAt(i) ?? 0;
  }

  return parseWavToFloat32(bytes);
}

/**
 * Parse raw WAV bytes into a Float32Array of normalized samples.
 */
function parseWavToFloat32(bytes: Uint8Array): Float32Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // Verify RIFF header
  const riff = String.fromCodePoint(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (riff !== 'RIFF') {
    throw new Error(`Not a valid WAV file: expected RIFF header, got "${riff}"`);
  }

  const wave = String.fromCodePoint(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (wave !== 'WAVE') {
    throw new Error(`Not a valid WAV file: expected WAVE format, got "${wave}"`);
  }

  // Find the fmt chunk
  let offset = 12;
  let audioFormat = 0;
  let numChannels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;

  while (offset < bytes.length - 8) {
    const chunkId = String.fromCodePoint(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3],
    );
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === 'fmt ') {
      audioFormat = view.getUint16(offset + 8, true);
      numChannels = view.getUint16(offset + 10, true);
      sampleRate = view.getUint32(offset + 12, true);
      bitsPerSample = view.getUint16(offset + 22, true);
    }

    if (chunkId === 'data') {
      // Found the data chunk
      const dataStart = offset + 8;
      const dataLength = Math.min(chunkSize, bytes.length - dataStart);

      if (audioFormat !== 1) {
        throw new Error(
          `Unsupported WAV format: expected PCM (1), got ${audioFormat}. ` +
          'Only uncompressed PCM WAV files are supported for local transcription.',
        );
      }

      return extractPcmSamples(
        bytes,
        dataStart,
        dataLength,
        bitsPerSample,
        numChannels,
        sampleRate,
      );
    }

    offset += 8 + chunkSize;
    // Ensure chunk alignment (chunks are word-aligned)
    if (chunkSize % 2 !== 0) offset++;
  }

  throw new Error('No data chunk found in WAV file.');
}

/**
 * Extract PCM samples from the data chunk and return normalized Float32Array.
 * Handles 16-bit and 32-bit PCM, mono and multi-channel (downmixed to mono).
 * Resamples to 16kHz if needed.
 */
function extractPcmSamples(
  bytes: Uint8Array,
  dataStart: number,
  dataLength: number,
  bitsPerSample: number,
  numChannels: number,
  sampleRate: number,
): Float32Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const bytesPerSample = bitsPerSample / 8;
  const totalSamples = Math.floor(dataLength / (bytesPerSample * numChannels));

  // Read samples and downmix to mono
  const monoSamples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    let sum = 0;
    for (let ch = 0; ch < numChannels; ch++) {
      const sampleOffset = dataStart + (i * numChannels + ch) * bytesPerSample;
      if (sampleOffset + bytesPerSample > bytes.length) break;

      if (bitsPerSample === 16) {
        const sample = view.getInt16(sampleOffset, true);
        sum += sample / 32768; // Normalize to [-1.0, 1.0]
      } else if (bitsPerSample === 32) {
        const sample = view.getInt32(sampleOffset, true);
        sum += sample / 2147483648;
      } else if (bitsPerSample === 8) {
        const sample = bytes[sampleOffset] ?? 128;
        sum += (sample - 128) / 128;
      } else {
        throw new Error(`Unsupported PCM bit depth: ${bitsPerSample}`);
      }
    }
    monoSamples[i] = sum / numChannels;
  }

  // Resample to 16kHz if necessary
  const targetRate = 16000;
  if (sampleRate === targetRate) {
    return monoSamples;
  }

  return resample(monoSamples, sampleRate, targetRate);
}

/**
 * Simple linear interpolation resampler.
 * Converts from one sample rate to another.
 */
function resample(
  samples: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  const ratio = fromRate / toRate;
  const outputLength = Math.floor(samples.length / ratio);
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const srcFloor = Math.floor(srcIndex);
    const srcCeil = Math.min(srcFloor + 1, samples.length - 1);
    const frac = srcIndex - srcFloor;

    output[i] = (samples[srcFloor] ?? 0) * (1 - frac) + (samples[srcCeil] ?? 0) * frac;
  }

  return output;
}

/**
 * Check if a file is a WAV file by reading its header.
 * Returns true if the file starts with RIFF...WAVE header.
 */
export async function isWavFile(fileUri: string): Promise<boolean> {
  try {
    const uri = fileUri.startsWith('file://') ? fileUri : `file://${fileUri}`;

    // Read first 12 bytes (RIFF header)
    // expo-file-system doesn't support partial reads, so read a small chunk
    // Use readAsStringAsync with position/length if available, otherwise read
    // a small portion via base64
    const base64Data = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
      // Read the whole file as base64 is inefficient for just checking header,
      // but expo-file-system doesn't support range reads.
      // For WAV check, we'll check the extension first as a fast path.
    });

    if (base64Data.length < 16) return false; // Too small to be a WAV

    const headerStr = atob(base64Data.substring(0, 16)); // First 12 bytes
    return (
      headerStr.startsWith('RIFF') &&
      headerStr.substring(8, 12) === 'WAVE'
    );
  } catch {
    return false;
  }
}

/**
 * Quick check based on file extension.
 * More efficient than reading the file header.
 */
export function isWavExtension(filePath: string): boolean {
  return filePath.toLowerCase().endsWith('.wav');
}
