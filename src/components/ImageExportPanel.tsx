import React, { useState } from 'react';
import { Download, Loader2, CheckCircle, Sparkles, Image as ImageIcon } from 'lucide-react';
import { EnhancementSettings, ImageMetadata, ResolutionConfig } from '../types';
import { ImageExporter } from '../utils/imageExporter';

interface ImageExportPanelProps {
  metadata: ImageMetadata;
  settings: EnhancementSettings;
  selectedPreset: ResolutionConfig;
  targetWidth: number;
  targetHeight: number;
}

export const ImageExportPanel: React.FC<ImageExportPanelProps> = ({
  metadata,
  settings,
  selectedPreset,
  targetWidth,
  targetHeight,
}) => {
  const [format, setFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState<{
    url: string;
    filename: string;
    sizeMb: number;
  } | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = metadata.src;

    await new Promise<void>((resolve, reject) => {
      if (img.complete) {
        resolve();
      } else {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image for export'));
      }
    });

    const exporter = new ImageExporter();
    try {
      const { blob, url, filename } = await exporter.exportImage(
        img,
        settings,
        targetWidth,
        targetHeight,
        format,
        0.95
      );

      const sizeMb = Number((blob.size / (1024 * 1024)).toFixed(2));
      setDownloadInfo({ url, filename, sizeMb });

      // Automatically trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    } catch (err) {
      console.error('Image export failed:', err);
    } finally {
      setIsExporting(false);
      exporter.destroy();
    }
  };

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left info */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white">
              Export Enhanced Photo ({targetWidth} × {targetHeight} px)
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 font-mono">
              {selectedPreset.label} AI Super-Res
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Instant GPU rendering. Crystal clear edge details, no watermark, 100% free.
          </p>
        </div>

        {/* Right CTA */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Format selector */}
          <div className="flex items-center gap-1 bg-neutral-800/80 border border-neutral-700/80 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setFormat('image/png')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                format === 'image/png'
                  ? 'bg-cyan-500 text-neutral-950 font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              PNG (Lossless)
            </button>
            <button
              type="button"
              onClick={() => setFormat('image/jpeg')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                format === 'image/jpeg'
                  ? 'bg-cyan-500 text-neutral-950 font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              JPG (Universal)
            </button>
            <button
              type="button"
              onClick={() => setFormat('image/webp')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                format === 'image/webp'
                  ? 'bg-cyan-500 text-neutral-950 font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              WebP
            </button>
          </div>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-neutral-950 bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 rounded-lg shadow-md transition-all cursor-pointer hover:shadow-cyan-500/20 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                <span>Enhancing...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Enhanced Photo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {downloadInfo && !isExporting && (
        <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Image successfully enhanced and downloaded ({downloadInfo.filename} · {downloadInfo.sizeMb} MB)
            </span>
          </div>
          <a
            href={downloadInfo.url}
            download={downloadInfo.filename}
            className="font-medium underline hover:text-emerald-300"
          >
            Download again
          </a>
        </div>
      )}
    </div>
  );
};
