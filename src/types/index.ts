export type ResolutionTier =
  | '144p'
  | '240p'
  | '360p'
  | '480p'
  | '720p'
  | '1080p'
  | '1440p'
  | '4k'
  | '8k';

export interface ResolutionConfig {
  id: ResolutionTier;
  label: string;
  name: string;
  targetHeight: number;
  standardWidth: number; // For 16:9 reference
  bitrateMbps: number;
  category: 'downscale' | 'standard' | 'hd' | 'ultra';
  badge?: string;
}

export type MediaType = 'video' | 'image';

export interface ImageMetadata {
  file?: File;
  src: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: number;
  sizeBytes?: number;
  format: string;
}

export interface VideoMetadata {
  file?: File;
  src: string;
  name: string;
  duration: number;
  width: number;
  height: number;
  aspectRatio: number;
  sizeBytes?: number;
  format: string;
}

export interface EnhancementSettings {
  preset: 'clarity' | 'cinema' | 'vivid' | 'smooth' | 'custom';
  sharpness: number;        // 0 - 200 (100 is default)
  edgeBoost: number;        // 0 - 100
  microContrast: number;    // 0 - 100
  saturation: number;       // 80 - 150
  brightness: number;       // 90 - 120
  denoise: number;          // 0 - 100
}

export interface ProcessingState {
  isProcessing: boolean;
  progress: number; // 0 - 100
  currentFrame?: number;
  totalFrames?: number;
  elapsedSeconds: number;
  estimatedRemainingSeconds: number;
  statusText: string;
  downloadUrl?: string;
  downloadFilename?: string;
  exportedBlob?: Blob;
  outputWidth?: number;
  outputHeight?: number;
  outputSizeMb?: number;
  error?: string;
}
