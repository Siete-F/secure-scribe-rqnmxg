/**
 * Whisper Model Configuration
 *
 * Two multilingual model variants hosted by Software Mansion (react-native-executorch):
 *   - Base (~148 MB): Good quality, faster inference
 *   - Small (~488 MB): Best quality, larger download
 *
 * Both use ExecuTorch .pte format with XNNPACK backend.
 * Both are multilingual: Dutch, English, and 90+ languages.
 */

// --- Model Variant Definitions ---

export type WhisperVariantId = 'base' | 'small';

export interface WhisperVariant {
  id: WhisperVariantId;
  name: string;
  description: string;
  totalSizeMB: number;
  urls: {
    encoder: string;
    decoder: string;
    tokenizer: string;
  };
}

const HF_BASE =
  'https://huggingface.co/software-mansion/react-native-executorch';
const VERSION = 'resolve/v0.7.0';

export const WHISPER_VARIANTS: Record<WhisperVariantId, WhisperVariant> = {
  base: {
    id: 'base',
    name: 'Whisper Base (Multilingual)',
    description:
      'Good quality, ~148 MB total. Supports Dutch and 90+ languages. Faster inference.',
    totalSizeMB: 148,
    urls: {
      encoder: `${HF_BASE}-whisper-base/${VERSION}/xnnpack/whisper_base_encoder_xnnpack.pte`,
      decoder: `${HF_BASE}-whisper-base/${VERSION}/xnnpack/whisper_base_decoder_xnnpack.pte`,
      tokenizer: `${HF_BASE}-whisper-base/${VERSION}/tokenizer.json`,
    },
  },
  small: {
    id: 'small',
    name: 'Whisper Small (Multilingual)',
    description:
      'Best quality, ~488 MB total. Supports Dutch and 90+ languages. Best accuracy.',
    totalSizeMB: 488,
    urls: {
      encoder: `${HF_BASE}-whisper-small/${VERSION}/xnnpack/whisper_small_encoder_xnnpack.pte`,
      decoder: `${HF_BASE}-whisper-small/${VERSION}/xnnpack/whisper_small_decoder_xnnpack.pte`,
      tokenizer: `${HF_BASE}-whisper-small/${VERSION}/tokenizer.json`,
    },
  },
};

export const DEFAULT_WHISPER_VARIANT: WhisperVariantId = 'small';

/** Minimum expected file size (bytes) for a valid encoder/decoder PTE file */
export const MIN_MODEL_FILE_SIZE = 5 * 1024 * 1024; // 5 MB — anything smaller is corrupt/incomplete

/** Directory name under documentDirectory for Whisper model files */
export const WHISPER_MODEL_DIR_NAME = 'whisper-stt';
