import React from 'react';
import {
  Download,
  Loader2,
  CheckCircle,
  Camera,
  XCircle,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ProcessingState, ResolutionConfig } from '../types';
import { formatTime } from '../utils/resolutionPresets';

interface ExportPanelProps {
  processingState: ProcessingState;
  selectedPreset: ResolutionConfig;
  targetWidth: number;
  targetHeight: number;
  onStartExport: () => void;
  onCancelExport: () => void;
  onCaptureFrame: () => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  processingState,
  selectedPreset,
  targetWidth,
  targetHeight,
  onStartExport,
  onCancelExport,
  onCaptureFrame,
}) => {
  const {
    isProcessing,
    progress,
    elapsedSeconds,
    estimatedRemainingSeconds,
    statusText,
    downloadUrl,
    downloadFilename,
    outputSizeMb,
  } = processingState;

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left summary */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white">
              Export to {selectedPreset.label} ({targetWidth} × {targetHeight})
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 font-mono">
              Fast Hardware Acceleration
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Free high-speed export. No watermark, no signup, no credit loss.
          </p>
        </div>

        {/* Right CTA Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onCaptureFrame}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/80 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            title="Export current frame as a high-res image"
          >
            <Camera className="w-3.5 h-3.5 text-neutral-400" />
            <span>Save Still Frame ({targetHeight}p PNG)</span>
          </button>

          {!isProcessing && !downloadUrl && (
            <button
              type="button"
              onClick={onStartExport}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-neutral-950 bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 rounded-lg shadow-md transition-all cursor-pointer hover:shadow-cyan-500/20"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Upscale & Export Video</span>
            </button>
          )}

          {isProcessing && (
            <button
              type="button"
              onClick={onCancelExport}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-red-300 hover:text-red-200 bg-red-950/50 hover:bg-red-900/60 border border-red-800/60 rounded-lg transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Processing</span>
            </button>
          )}

          {downloadUrl && !isProcessing && (
            <a
              href={downloadUrl}
              download={downloadFilename || `SuperScale_${targetHeight}p.webm`}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-lg shadow-md transition-all cursor-pointer hover:shadow-emerald-500/20 animate-pulse"
            >
              <Download className="w-4 h-4" />
              <span>Download Enhanced Video ({targetHeight}p)</span>
            </a>
          )}
        </div>
      </div>

      {/* Progress Bar & Status (Visible during processing) */}
      {isProcessing && (
        <div className="mt-5 pt-4 border-t border-neutral-800/80 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-cyan-300 font-medium flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              {statusText}
            </span>
            <div className="flex items-center gap-3 font-mono text-neutral-400 tabular-nums">
              <span>Elapsed: {formatTime(elapsedSeconds)}</span>
              <span aria-hidden="true">·</span>
              <span>Remaining: ~{formatTime(estimatedRemainingSeconds)}</span>
              <span aria-hidden="true">·</span>
              <span className="text-white font-bold">{progress}%</span>
            </div>
          </div>

          <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Completion Banner with direct download */}
      {downloadUrl && !isProcessing && (
        <div className="mt-5 pt-4 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">Video successfully enhanced and ready!</p>
              <p className="text-neutral-400 mt-0.5">
                Saved at {targetWidth} × {targetHeight} ({targetHeight}p) {outputSizeMb ? `· ${outputSizeMb} MB` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              download={downloadFilename || `SuperScale_${targetHeight}p.webm`}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File Now</span>
            </a>

            <button
              type="button"
              onClick={onStartExport}
              className="px-3 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
            >
              Re-Export
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
