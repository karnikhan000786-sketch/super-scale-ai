import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  Eye,
  Columns,
} from 'lucide-react';
import { EnhancementSettings, VideoMetadata } from '../types';
import { WebGLEnhancer } from '../utils/webglEnhancer';
import { formatTime } from '../utils/resolutionPresets';

interface ComparisonPlayerProps {
  metadata: VideoMetadata;
  settings: EnhancementSettings;
  targetWidth: number;
  targetHeight: number;
}

export const ComparisonPlayer: React.FC<ComparisonPlayerProps> = ({
  metadata,
  settings,
  targetWidth,
  targetHeight,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const enhancedCanvasRef = useRef<HTMLCanvasElement>(null);
  const enhancerRef = useRef<WebGLEnhancer | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(metadata.duration || 0);
  const [splitPos, setSplitPos] = useState(50); // percentage 0 - 100
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side' | 'enhanced'>('split');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize WebGL enhancer on canvas mount
  useEffect(() => {
    if (enhancedCanvasRef.current) {
      enhancerRef.current = new WebGLEnhancer(enhancedCanvasRef.current);
    }
    return () => {
      enhancerRef.current?.destroy();
      enhancerRef.current = null;
    };
  }, []);

  // Render loop: draws original frame to original canvas, and enhanced frame through WebGL
  const renderFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    // 1. Draw raw frame to original canvas
    if (originalCanvasRef.current) {
      const origCanvas = originalCanvasRef.current;
      if (origCanvas.width !== targetWidth || origCanvas.height !== targetHeight) {
        origCanvas.width = targetWidth;
        origCanvas.height = targetHeight;
      }
      const ctx = origCanvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'low'; // Simulates standard soft scaling
        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      }
    }

    // 2. Draw enhanced frame through WebGL shader
    if (enhancerRef.current) {
      enhancerRef.current.render(video, settings, targetWidth, targetHeight);
    }
  }, [settings, targetWidth, targetHeight]);

  useEffect(() => {
    let animId: number;
    const loop = () => {
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        renderFrame();
        setCurrentTime(videoRef.current.currentTime);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [renderFrame]);

  // Handle video events
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      renderFrame();
    }
  };

  const handleSeeked = () => {
    renderFrame();
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleTimeSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      renderFrame();
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Dragging split slider
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

  // Re-render when settings or target changes
  useEffect(() => {
    renderFrame();
  }, [settings, targetWidth, targetHeight, renderFrame]);

  return (
    <div id="comparison" className="w-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
      {/* Top bar inside player with view controls */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-950/80 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-white">Live Quality Comparison</span>
          <span aria-hidden="true" className="text-neutral-600">·</span>
          <span className="text-neutral-400">
            {viewMode === 'split'
              ? 'Drag divider to compare Original vs AI Super-Resolution'
              : viewMode === 'side-by-side'
              ? 'Side-by-side Comparison'
              : 'Full AI Enhanced View'}
          </span>
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
            Split Slider
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
            Enhanced 100%
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-black overflow-hidden select-none flex items-center justify-center cursor-default"
        onMouseDown={() => {
          if (viewMode === 'split') setIsDraggingSplit(true);
        }}
        onTouchStart={() => {
          if (viewMode === 'split') setIsDraggingSplit(true);
        }}
      >
        {/* Hidden source video element providing playback & frames */}
        <video
          ref={videoRef}
          src={metadata.src}
          crossOrigin="anonymous"
          playsInline
          muted={isMuted}
          onLoadedMetadata={handleLoadedMetadata}
          onSeeked={handleSeeked}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />

        {/* View Mode: SPLIT SCREEN (Interactive Slider) */}
        {viewMode === 'split' && (
          <div className="relative w-full h-full flex items-center justify-center">
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
          <div className="w-full h-full flex items-center">
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
          <div className="relative w-full h-full flex items-center justify-center">
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

      {/* Media Controller Bar */}
      <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex flex-col gap-2.5">
        {/* Timeline Scrubber */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-neutral-400 tabular-nums w-12 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.05}
            value={currentTime}
            onChange={handleTimeSeek}
            className="flex-1 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <span className="font-mono text-xs text-neutral-400 tabular-nums w-12">
            {formatTime(duration)}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              type="button"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  setCurrentTime(0);
                  renderFrame();
                }
              }}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Restart from beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-neutral-400 hidden sm:flex items-center gap-2">
              <span>Target:</span>
              <span className="font-mono text-white tabular-nums">
                {targetWidth} × {targetHeight}
              </span>
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
