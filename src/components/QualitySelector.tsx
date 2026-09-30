import React from 'react';
import { ResolutionTier, VideoMetadata } from '../types';
import { RESOLUTION_PRESETS, calculateTargetDimensions } from '../utils/resolutionPresets';
import { ArrowUpRight, ArrowDownRight, Check } from 'lucide-react';

interface QualitySelectorProps {
  selectedTier: ResolutionTier;
  onSelectTier: (tier: ResolutionTier) => void;
  metadata?: VideoMetadata | null;
}

export const QualitySelector: React.FC<QualitySelectorProps> = ({
  selectedTier,
  onSelectTier,
  metadata,
}) => {
  const origWidth = metadata?.width || 640;
  const origHeight = metadata?.height || 360;

  return (
    <div id="resolutions" className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Target Quality (144p to 8K)</h3>
          <p className="text-xs text-neutral-400">
            Select your desired output resolution. AI Edge Super-Resolution automatically synthesizes crisp details.
          </p>
        </div>

        {metadata && (
          <div className="text-xs text-neutral-400 flex items-center gap-2">
            <span>Source:</span>
            <span className="font-mono text-neutral-200 tabular-nums">
              {origWidth} × {origHeight} ({origHeight}p)
            </span>
          </div>
        )}
      </div>

      {/* Grid of resolution buttons */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
        {RESOLUTION_PRESETS.map((preset) => {
          const isSelected = selectedTier === preset.id;
          const { width, height, scaleFactor } = calculateTargetDimensions(
            origWidth,
            origHeight,
            preset.id
          );
          const isUpscale = scaleFactor > 1.05;
          const isDownscale = scaleFactor < 0.95;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectTier(preset.id)}
              className={`flex flex-col items-center justify-between p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-sm ring-1 ring-cyan-400/40'
                  : 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
              }`}
            >
              <div className="w-full flex items-center justify-between mb-1">
                <span className="text-xs font-bold font-mono tracking-tight">
                  {preset.label}
                </span>
                {isSelected ? (
                  <Check className="w-3 h-3 text-cyan-400" />
                ) : isUpscale ? (
                  <ArrowUpRight className="w-2.5 h-2.5 text-emerald-400/70" />
                ) : isDownscale ? (
                  <ArrowDownRight className="w-2.5 h-2.5 text-amber-400/70" />
                ) : null}
              </div>

              <div className="text-[11px] font-mono text-neutral-400 tabular-nums my-0.5 leading-tight">
                {height}p
              </div>

              <div className="text-[10px] text-neutral-500 font-mono tabular-nums leading-tight">
                {isUpscale ? `${scaleFactor}x` : isDownscale ? `${scaleFactor}x` : '1.0x'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Resolution Detail Summary */}
      {(() => {
        const activePreset = RESOLUTION_PRESETS.find((p) => p.id === selectedTier)!;
        const targetDims = calculateTargetDimensions(origWidth, origHeight, selectedTier);
        const isUpscaling = targetDims.scaleFactor > 1.0;

        return (
          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{activePreset.name}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-neutral-200 tabular-nums">
                Output: {targetDims.width} × {targetDims.height} px
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {isUpscaling
                  ? `AI Super Resolution ${targetDims.scaleFactor}x Scaling`
                  : 'Downscale & Data Saver'}
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono tabular-nums text-neutral-400">
              <span>Target Bitrate: ~{activePreset.bitrateMbps} Mbps</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
