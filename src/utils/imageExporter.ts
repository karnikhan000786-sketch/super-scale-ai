import { EnhancementSettings } from '../types';
import { WebGLEnhancer } from './webglEnhancer';

export class ImageExporter {
  private canvas: HTMLCanvasElement;
  private enhancer: WebGLEnhancer;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.enhancer = new WebGLEnhancer(this.canvas);
  }

  public async exportImage(
    imageElement: HTMLImageElement,
    settings: EnhancementSettings,
    targetWidth: number,
    targetHeight: number,
    format: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png',
    quality = 0.95
  ): Promise<{ blob: Blob; url: string; filename: string }> {
    this.canvas.width = targetWidth;
    this.canvas.height = targetHeight;

    // Render through WebGL shader at target resolution
    this.enhancer.render(imageElement, settings, targetWidth, targetHeight);

    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'));
            return;
          }
          const url = URL.createObjectURL(blob);
          const ext = format === 'image/png' ? 'png' : format === 'image/jpeg' ? 'jpg' : 'webp';
          const filename = `SuperScale_AI_${targetHeight}p_${Date.now()}.${ext}`;
          resolve({ blob, url, filename });
        },
        format,
        quality
      );
    });
  }

  public destroy() {
    this.enhancer.destroy();
  }
}
