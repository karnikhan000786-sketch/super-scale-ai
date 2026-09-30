import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Eye,
  Columns,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { EnhancementSettings, ImageMetadata } from '../types';
import { WebGLEnhancer } from '../utils/webglEnhancer';

interface ImageComparisonPlayerProps {
  metadata: ImageMetadata;
  settings: EnhancementSettings;
  targetWidth: number;
  targetHeight: number;
}

export const ImageComparisonPlayer: React.FC<ImageComparisonPlayerProps> = ({
  metadata,
  settings,
  targetWidth,
  targetHeight,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const enhancedCanvasRef = useRef<HTMLCanvasElement>(null);
  const enhancerRef = useRef<WebGLEnhancer | null>(null);

  const [splitPos, setSplitPos] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side' | 'enhanced'>('split');
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize WebGL enhancer
  useEffect(() => {
    if (enhancedCanvasRef.current) {
      enhancerRef.current = new WebGLEnhancer(enhancedCanvasRef.current);
    }
    return () => {
      enhancerRef.current?.destroy();
      enhancerRef.current = null;
    };
  }, []);

  const renderFrame = useCallback(() => {
    const img = imageRef.current;
    if (!img || !img.complete || img.naturalWidth === 0) return;

    // 1. Draw raw image to original canvas
    if (originalCanvasRef.current) {
      const origCanvas = originalCanvasRef.current;
      if (origCanvas.width !== targetWidth || origCanvas.height !== targetHeight) {
        origCanvas.width = targetWidth;
        origCanvas.height = targetHeight;
      }
      const ctx = origCanvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'low'; // Raw soft bilinear scaling
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      }
    }

    // 2. Draw enhanced frame through WebGL shader
    if (enhancerRef.current) {
      enhancerRef.current.render(img, settings, targetWidth, targetHeight);
    }
  }, [settings, targetWidth, targetHeight]);

  useEffect(() => {
    renderFrame();
  }, [renderFrame, metadata.src]);

  // Handle split drag
  const handleSplitMouseMove = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!isDraggingSplit || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSplitPos(percent);
  };

  const handleSplitTouchMove = (e: React.TouchEvent<HTMLDivElement> | TouchEvent) => {
    if (!isDraggingSplit || !containerRef.current) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSplitPos(percent);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDraggingSplit(false);
    if (isDraggingSplit) {
      window.addEventListener('mousemove', handleSplitMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleSplitTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleSplitMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleSplitTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDraggingSplit]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div id="comparison" className="w-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
      {/* Top bar inside player with view controls */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-neutral-950/80 border-b border-neutral-800 text-xs gap-2">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-white">Live Photo Quality Comparison</span>
          <span aria-hidden="true" className="text-neutral-600 hidden sm:inline">·</span>
          <span className="text-neutral-400 hidden sm:inline">
            {viewMode === 'split'
              ? 'Drag divider to compare Original vs AI Super-Resolution'
              : viewMode === 'side-by-side'
              ? 'Side-by-side Comparison'
              : 'Full AI Enhanced View'}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
              className="p-1 text-neutral-400 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] text-neutral-300 px-1 tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
              className="p-1 text-neutral-400 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            {zoom !== 1 && (
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="p-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'split' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Split
            </button>
            <button
              type="button"
              onClick={() => setViewMode('side-by-side')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'side-by-side' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Side-by-Side
            </button>
            <button
              type="button"
              onClick={() => setViewMode('enhanced')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'enhanced' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Enhanced
            </button>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] sm:aspect-video bg-neutral-950 overflow-hidden select-none flex items-center justify-center cursor-default"
        onMouseDown={() => {
          if (viewMode === 'split') setIsDraggingSplit(true);
        }}
        onTouchStart={() => {
          if (viewMode === 'split') setIsDraggingSplit(true);
        }}
      >
        {/* Hidden Source Image */}
        <img
          ref={imageRef}
          src={metadata.src}
          alt={metadata.name}
          crossOrigin="anonymous"
          onLoad={renderFrame}
          className="hidden"
        />

        {/* View Mode: SPLIT SCREEN (Interactive Slider) */}
        {viewMode === 'split' && (
          <div
            className="relative w-full h-full flex items-center justify-center transition-transform duration-150"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* 1. Underlying: Original Frame Canvas */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <canvas
                ref={originalCanvasRef}
                className="w-full h-full object-contain"
              />
            </div>

            {/* 2. Top layer: Enhanced WebGL Canvas with clip-path matching splitPos */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none transition-none"
              style={{
                clipPath: `polygon(${splitPos}% 0, 100% 0, 100% 100%, ${splitPos}% 100%)`,
              }}
            >
              <canvas
                ref={enhancedCanvasRef}
                className="w-full h-full object-contain"
              />
            </div>

            {/* 3. Divider Line and Handle */}
            <div
              className="absolute top-0 bottom-0 z-20 flex flex-col items-center pointer-events-auto cursor-ew-resize group"
              style={{ left: `${splitPos}%`, transform: 'translateX(-50%)' }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsDraggingSplit(true);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                setIsDraggingSplit(true);
              }}
            >
              <div className="w-0.5 h-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
              <div className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-neutral-900 border-2 border-cyan-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Columns className="w-4 h-4 text-cyan-400 rotate-90" />
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none bg-neutral-950/70 backdrop-blur-sm border border-neutral-800 text-neutral-300 text-xs px-2.5 py-1 rounded">
              Original ({metadata.height}p Raw)
            </div>
            <div className="absolute top-4 right-4 z-10 pointer-events-none bg-cyan-950/80 backdrop-blur-sm border border-cyan-500/50 text-cyan-200 text-xs px-2.5 py-1 rounded font-medium">
              AI Enhanced ({targetHeight}p Crisp)
            </div>
          </div>
        )}

        {/* View Mode: SIDE BY SIDE */}
        {viewMode === 'side-by-side' && (
          <div
            className="w-full h-full flex items-center transition-transform duration-150"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* Left: Original Canvas */}
            <div className="relative w-1/2 h-full border-r border-neutral-800 flex items-center justify-center">
              <canvas
                ref={originalCanvasRef}
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-neutral-950/80 border border-neutral-800 text-neutral-300 text-[11px] px-2 py-0.5 rounded">
                Original {metadata.height}p
              </div>
            </div>

            {/* Right: AI Enhanced Canvas */}
            <div className="relative w-1/2 h-full flex items-center justify-center">
              <canvas
                ref={enhancedCanvasRef}
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 right-3 bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-[11px] px-2 py-0.5 rounded">
                AI Enhanced {targetHeight}p
              </div>
            </div>
          </div>
        )}

        {/* View Mode: FULL ENHANCED */}
        {viewMode === 'enhanced' && (
          <div
            className="relative w-full h-full flex items-center justify-center transition-transform duration-150"
            style={{ transform: `scale(${zoom})` }}
          >
            <canvas
              ref={enhancedCanvasRef}
              className="w-full h-full object-contain"
            />
            <div className="absolute top-4 right-4 bg-cyan-950/80 backdrop-blur-sm border border-cyan-500/50 text-cyan-200 text-xs px-2.5 py-1 rounded font-medium">
              AI Enhanced {targetHeight}p
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="px-4 py-2.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <span>Source:</span>
          <span className="font-mono text-neutral-200 tabular-nums">
            {metadata.width} × {metadata.height} px
          </span>
          <span aria-hidden="true">·</span>
          <span>Target AI Resolution:</span>
          <span className="font-mono text-cyan-400 tabular-nums font-semibold">
            {targetWidth} × {targetHeight} px
          </span>
        </div>

        <div className="font-mono tabular-nums text-neutral-400">
          Scale: {(targetHeight / metadata.height).toFixed(2)}x
        </div>
      </div>
    </div>
  );
};
