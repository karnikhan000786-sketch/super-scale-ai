export interface SampleVideo {
  id: string;
  name: string;
  resolution: string;
  description: string;
  generateBlob?: () => Promise<{ blob: Blob; url: string; width: number; height: number }>;
  url?: string;
}

/**
 * Procedurally generates a realistic low-resolution video clip (360p or 480p)
 * featuring fine line patterns, moving text, geometric shapes, and realistic textures.
 * Perfect for testing sharpening, edge synthesis, and super-resolution immediately!
 */
export async function generateDemoVideo(
  width = 640,
  height = 360,
  durationSec = 5
): Promise<{ blob: Blob; url: string; width: number; height: number }> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const fps = 30;
  const totalFrames = durationSec * fps;
  const stream = canvas.captureStream(fps);

  let mimeType = 'video/webm;codecs=vp8';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 1000000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      resolve({ blob, url, width, height });
    };

    recorder.start();

    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      const t = frame / fps;

      // Dark cinematic background
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(1, '#131e36');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Fine grid pattern (tests edge sharpness)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Moving glowing orbital particles
      for (let i = 0; i < 5; i++) {
        const angle = t * 1.5 + (i * Math.PI * 2) / 5;
        const radius = 60 + Math.sin(t * 2 + i) * 20;
        const cx = width / 2 + Math.cos(angle) * radius;
        const cy = height / 2 + Math.sin(angle) * (radius * 0.6);

        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? '#06b6d4' : '#3b82f6';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Center tech badge with fine typography
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SUPERSCALE TEST 360p', width / 2, height / 2 - 25);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '400 13px sans-serif';
      ctx.fillText('Natural Detail & Edge Synthesis Test', width / 2, height / 2 + 5);

      // Timestamp counter
      ctx.fillStyle = '#38bdf8';
      ctx.font = '500 12px monospace';
      ctx.fillText(`FRAME: ${frame} / ${totalFrames}  |  TIME: ${t.toFixed(2)}s`, width / 2, height / 2 + 35);

      // Simulated low-res softening layer (to replicate real compressed 360p video)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(0, 0, width, height);

      if (frame >= totalFrames) {
        clearInterval(interval);
        setTimeout(() => recorder.stop(), 100);
      }
    }, 1000 / fps);
  });
}

export const SAMPLE_VIDEOS: SampleVideo[] = [
  {
    id: 'demo-360p',
    name: '360p Motion & Grid Pattern',
    resolution: '640 × 360',
    description: 'High-frequency text and moving orbits. Perfect for testing edge clarity.',
    generateBlob: () => generateDemoVideo(640, 360, 5),
  },
  {
    id: 'demo-240p',
    name: '240p Compressed Retro Clip',
    resolution: '426 × 240',
    description: 'Low-res compressed footage ideal for testing dramatic 4K/8K AI upscaling.',
    generateBlob: () => generateDemoVideo(426, 240, 4),
  },
];
