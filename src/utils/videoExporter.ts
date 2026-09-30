import { EnhancementSettings, ProcessingState } from '../types';
import { WebGLEnhancer } from './webglEnhancer';

export class VideoExporter {
  private video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private enhancer: WebGLEnhancer;
  private mediaRecorder: MediaRecorder | null = null;
  private isCancelled = false;

  constructor(video: HTMLVideoElement) {
    this.video = video;
    this.canvas = document.createElement('canvas');
    this.enhancer = new WebGLEnhancer(this.canvas);
  }

  public cancel() {
    this.isCancelled = true;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // ignore
      }
    }
  }

  public async exportVideo(
    settings: EnhancementSettings,
    targetWidth: number,
    targetHeight: number,
    bitrateMbps: number,
    onProgress: (state: Partial<ProcessingState>) => void
  ): Promise<{ blob: Blob; url: string; filename: string }> {
    this.isCancelled = false;
    const duration = this.video.duration || 5;

    // Determine optimal supported mime type
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/mp4';
    }

    // Set canvas dimensions
    this.canvas.width = targetWidth;
    this.canvas.height = targetHeight;

    // Initial render
    this.enhancer.render(this.video, settings, targetWidth, targetHeight);

    // Prepare media stream from canvas
    // Use 30 or 60 FPS
    const fps = 30;
    const canvasStream = this.canvas.captureStream(fps);

    // Try to extract audio track from video element if available
    try {
      const anyVideo = this.video as any;
      if (typeof anyVideo.captureStream === 'function') {
        const videoStream = anyVideo.captureStream();
        const audioTracks = videoStream.getAudioTracks();
        if (audioTracks && audioTracks.length > 0) {
          canvasStream.addTrack(audioTracks[0]);
        }
      } else if (typeof anyVideo.mozCaptureStream === 'function') {
        const videoStream = anyVideo.mozCaptureStream();
        const audioTracks = videoStream.getAudioTracks();
        if (audioTracks && audioTracks.length > 0) {
          canvasStream.addTrack(audioTracks[0]);
        }
      }
    } catch (e) {
      console.warn('Audio track capture skipped or not supported:', e);
    }

    const bps = Math.round(bitrateMbps * 1000 * 1000);
    const recordedChunks: Blob[] = [];

    this.mediaRecorder = new MediaRecorder(canvasStream, {
      mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
      videoBitsPerSecond: bps,
    });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    return new Promise<{ blob: Blob; url: string; filename: string }>((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder initialization failed'));
        return;
      }

      const recorder = this.mediaRecorder;
      const startTime = performance.now();

      recorder.onstop = () => {
        if (this.isCancelled) {
          reject(new Error('Export was cancelled by user'));
          return;
        }

        const outBlob = new Blob(recordedChunks, {
          type: recorder.mimeType || 'video/webm',
        });
        const outUrl = URL.createObjectURL(outBlob);
        const extension = recorder.mimeType.includes('mp4') ? 'mp4' : 'webm';
        const filename = `SuperScale_${targetHeight}p_${Date.now()}.${extension}`;

        onProgress({
          isProcessing: false,
          progress: 100,
          statusText: 'Upscale Complete! Ready to download.',
          downloadUrl: outUrl,
          downloadFilename: filename,
          exportedBlob: outBlob,
          outputSizeMb: Number((outBlob.size / (1024 * 1024)).toFixed(2)),
          outputWidth: targetWidth,
          outputHeight: targetHeight,
        });

        resolve({ blob: outBlob, url: outUrl, filename });
      };

      recorder.onerror = (event) => {
        reject(new Error(`Recording error: ${(event as any).error?.message || 'Unknown'}`));
      };

      // Rewind video and start
      const originalTime = this.video.currentTime;
      const originalPlaybackRate = this.video.playbackRate;
      const originalMuted = this.video.muted;

      this.video.currentTime = 0;
      this.video.muted = true; // Mute during processing so no blaring sound

      // Use 1.25x or 1.5x fast processing if supported
      this.video.playbackRate = 1.0;

      recorder.start(100); // 100ms timeslices

      let animationFrameId: number;

      const renderLoop = () => {
        if (this.isCancelled) {
          cancelAnimationFrame(animationFrameId);
          this.video.pause();
          this.video.currentTime = originalTime;
          this.video.playbackRate = originalPlaybackRate;
          this.video.muted = originalMuted;
          return;
        }

        // Render current video frame through WebGL shader to canvas
        this.enhancer.render(this.video, settings, targetWidth, targetHeight);

        // Update progress
        const currentSec = this.video.currentTime;
        const progress = Math.min(99, Math.round((currentSec / duration) * 100));
        const elapsedSec = (performance.now() - startTime) / 1000;
        const estimatedTotalSec = progress > 0 ? (elapsedSec / progress) * 100 : duration;
        const estimatedRemainingSec = Math.max(0, estimatedTotalSec - elapsedSec);

        onProgress({
          isProcessing: true,
          progress,
          elapsedSeconds: Math.round(elapsedSec),
          estimatedRemainingSeconds: Math.round(estimatedRemainingSec),
          statusText: `Enhancing frames to ${targetHeight}p (${progress}%)...`,
        });

        // Check if finished
        if (this.video.ended || currentSec >= duration - 0.05) {
          cancelAnimationFrame(animationFrameId);
          this.video.pause();
          this.video.currentTime = originalTime;
          this.video.playbackRate = originalPlaybackRate;
          this.video.muted = originalMuted;

          setTimeout(() => {
            if (recorder.state !== 'inactive') {
              recorder.stop();
            }
          }, 200);
          return;
        }

        animationFrameId = requestAnimationFrame(renderLoop);
      };

      const playPromise = this.video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            animationFrameId = requestAnimationFrame(renderLoop);
          })
          .catch((err) => {
            reject(new Error(`Failed to play video for processing: ${err.message}`));
          });
      }
    });
  }

  /**
   * Captures a single crisp still frame at exact target resolution and returns a PNG Blob
   */
  public captureFrame(
    settings: EnhancementSettings,
    targetWidth: number,
    targetHeight: number
  ): Promise<{ blob: Blob; url: string }> {
    return new Promise((resolve, reject) => {
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;
      this.enhancer.render(this.video, settings, targetWidth, targetHeight);

      this.canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to generate frame image'));
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve({ blob, url });
      }, 'image/png');
    });
  }
}
