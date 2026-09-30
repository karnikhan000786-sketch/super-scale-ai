import { ResolutionConfig, ResolutionTier } from '../types';

export const RESOLUTION_PRESETS: ResolutionConfig[] = [
  {
    id: '144p',
    label: '144p',
    name: 'Ultra Low Saver',
    targetHeight: 144,
    standardWidth: 256,
    bitrateMbps: 0.3,
    category: 'downscale',
  },
  {
    id: '240p',
    label: '240p',
    name: 'Low Bandwidth',
    targetHeight: 240,
    standardWidth: 426,
    bitrateMbps: 0.6,
    category: 'downscale',
  },
  {
    id: '360p',
    label: '360p',
    name: 'Standard Mobile',
    targetHeight: 360,
    standardWidth: 640,
    bitrateMbps: 1.0,
    category: 'standard',
  },
  {
    id: '480p',
    label: '480p',
    name: 'SD DVD Quality',
    targetHeight: 480,
    standardWidth: 854,
    bitrateMbps: 2.0,
    category: 'standard',
  },
  {
    id: '720p',
    label: '720p',
    name: 'HD Ready',
    targetHeight: 720,
    standardWidth: 1280,
    bitrateMbps: 5.0,
    category: 'hd',
  },
  {
    id: '1080p',
    label: '1080p',
    name: 'Full HD 1080p',
    targetHeight: 1080,
    standardWidth: 1920,
    bitrateMbps: 10.0,
    category: 'hd',
    badge: 'Popular',
  },
  {
    id: '1440p',
    label: '1440p',
    name: '2K Quad HD',
    targetHeight: 1440,
    standardWidth: 2560,
    bitrateMbps: 16.0,
    category: 'ultra',
  },
  {
    id: '4k',
    label: '4K',
    name: '4K Ultra HD (2160p)',
    targetHeight: 2160,
    standardWidth: 3840,
    bitrateMbps: 25.0,
    category: 'ultra',
    badge: 'Ultra Crisp',
  },
  {
    id: '8k',
    label: '8K',
    name: '8K Extreme UHD (4320p)',
    targetHeight: 4320,
    standardWidth: 7680,
    bitrateMbps: 40.0,
    category: 'ultra',
    badge: 'Max Detail',
  },
];

/**
 * Calculates target output dimensions while strictly preserving the original video's aspect ratio.
 * Ensures even pixel dimensions for codec compatibility (divisible by 2).
 */
export function calculateTargetDimensions(
  originalWidth: number,
  originalHeight: number,
  targetPresetId: ResolutionTier,
  maxCanvasDimension = 4096
): { width: number; height: number; scaleFactor: number } {
  if (!originalWidth || !originalHeight) {
    return { width: 1920, height: 1080, scaleFactor: 1 };
  }

  const preset = RESOLUTION_PRESETS.find((p) => p.id === targetPresetId) || RESOLUTION_PRESETS[5];
  const isLandscape = originalWidth >= originalHeight;

  let targetWidth = 0;
  let targetHeight = 0;

  if (isLandscape) {
    // Height is the primary target constraint
    targetHeight = preset.targetHeight;
    targetWidth = Math.round((targetHeight * originalWidth) / originalHeight);
  } else {
    // Vertical video (e.g. 9:16 Shorts/Reels) -> Width matches target height equivalent or scale proportionally
    targetWidth = preset.targetHeight; // e.g. 1080 for 1080x1920
    targetHeight = Math.round((targetWidth * originalHeight) / originalWidth);
  }

  // Cap dimensions to canvas limit if browser/hardware imposes max dimension (e.g. 4096 or 8192)
  if (targetWidth > maxCanvasDimension || targetHeight > maxCanvasDimension) {
    const ratio = Math.min(maxCanvasDimension / targetWidth, maxCanvasDimension / targetHeight);
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  // Enforce even dimensions for H.264/VP9 codecs
  if (targetWidth % 2 !== 0) targetWidth += 1;
  if (targetHeight % 2 !== 0) targetHeight += 1;

  const scaleFactor = Number((targetHeight / originalHeight).toFixed(2));

  return {
    width: targetWidth,
    height: targetHeight,
    scaleFactor,
  };
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
