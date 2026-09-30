export interface SampleImage {
  id: string;
  name: string;
  resolution: string;
  description: string;
  generateBlob: () => Promise<{ blob: Blob; url: string; width: number; height: number }>;
}

/**
 * Procedurally generates realistic low-res test images featuring fine text, geometric architecture,
 * fine lines, and color gradients to test sharpening and super-resolution instantly.
 */
export async function generateDemoImage(
  type: 'architecture' | 'portrait' | 'cyberpunk',
  width = 640,
  height = 480
): Promise<{ blob: Blob; url: string; width: number; height: number }> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  if (type === 'architecture') {
    // Architectural facade with fine geometric lines & text
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#181b22');
    grad.addColorStop(1, '#0b0d11');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Architectural grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Modern glass building shapes
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(width * 0.2, height * 0.2, width * 0.6, height * 0.7);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(width * 0.2, height * 0.2, width * 0.6, height * 0.7);

    // Window panes
    ctx.fillStyle = '#0ea5e9';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        const wx = width * 0.25 + c * (width * 0.1);
        const wy = height * 0.26 + r * (height * 0.12);
        ctx.fillRect(wx, wy, width * 0.07, height * 0.08);
      }
    }

    // Typography banner
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('METROPOLIS ARCHITECTURE', width / 2, height * 0.14);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('Low Resolution Test Sample (480p) · Sharpness & Edge Test', width / 2, height * 0.85);

    // Intentionally blur slightly to replicate realistic compressed photo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, width, height);
  } else if (type === 'cyberpunk') {
    // Neon Cyberpunk digital art
    const grad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width);
    grad.addColorStop(0, '#2e1065');
    grad.addColorStop(0.6, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Neon rings
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(width / 2, height / 2 - 20, i * 40, 0, Math.PI * 2);
      ctx.strokeStyle = i % 2 === 0 ? '#f43f5e' : '#06b6d4';
      ctx.lineWidth = 3;
      ctx.shadowColor = i % 2 === 0 ? '#f43f5e' : '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Glowing center badge
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CYBERPUNK NEON ART', width / 2, height / 2 - 20);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '13px monospace';
    ctx.fillText('MICRO-CONTRAST & VIBRANCY TEST (360p)', width / 2, height / 2 + 70);
  } else {
    // Minimalist Studio Portrait graphic
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#27272a');
    grad.addColorStop(1, '#18181b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Silhouette & facial contour lines
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.45, 90, 0, Math.PI * 2);
    ctx.fillStyle = '#fde047';
    ctx.fill();

    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(width / 2 - 30, height * 0.42, 10, 0, Math.PI * 2);
    ctx.arc(width / 2 + 30, height * 0.42, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.48, 25, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PORTRAIT & DETAIL RESTORATION', width / 2, height * 0.82);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '12px sans-serif';
    ctx.fillText('Standard 480p Raw Frame', width / 2, height * 0.88);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      resolve({ blob, url, width, height });
    }, 'image/jpeg', 0.82);
  });
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'sample-arch',
    name: '480p Architectural Grid & Text',
    resolution: '640 × 480',
    description: 'Fine lines and typography. Perfect for testing edge clarity and text sharpness.',
    generateBlob: () => generateDemoImage('architecture', 640, 480),
  },
  {
    id: 'sample-neon',
    name: '360p Neon Cyberpunk Art',
    resolution: '640 × 360',
    description: 'Vibrant neon hues and rings to test micro-contrast and color dynamic range.',
    generateBlob: () => generateDemoImage('cyberpunk', 640, 360),
  },
  {
    id: 'sample-portrait',
    name: '480p Portrait & Contours',
    resolution: '640 × 480',
    description: 'Subtle curves and textures for face restoration and noise suppression.',
    generateBlob: () => generateDemoImage('portrait', 640, 480),
  },
];
