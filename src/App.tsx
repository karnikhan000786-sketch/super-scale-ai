import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { VideoUploader } from './components/VideoUploader';
import { QualitySelector } from './components/QualitySelector';
import { ComparisonPlayer } from './components/ComparisonPlayer';
import { ImageComparisonPlayer } from './components/ImageComparisonPlayer';
import { EnhancementControls } from './components/EnhancementControls';
import { ExportPanel } from './components/ExportPanel';
import { ImageExportPanel } from './components/ImageExportPanel';
import { ResolutionGuide } from './components/ResolutionGuide';
import { FeaturesInfo } from './components/FeaturesInfo';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import {
  EnhancementSettings,
  ImageMetadata,
  MediaType,
  ProcessingState,
  ResolutionTier,
  VideoMetadata,
} from './types';
import {
  RESOLUTION_PRESETS,
  calculateTargetDimensions,
  formatBytes,
  formatTime,
} from './utils/resolutionPresets';
import { VideoExporter } from './utils/videoExporter';
import { Sparkles, Film, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<MediaType>('video');
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [imageMetadata, setImageMetadata] = useState<ImageMetadata | null>(null);
  const [selectedTier, setSelectedTier] = useState<ResolutionTier>('1080p');

  const [settings, setSettings] = useState<EnhancementSettings>({
    preset: 'clarity',
    sharpness: 130,
    edgeBoost: 75,
    microContrast: 60,
    saturation: 110,
    brightness: 102,
    denoise: 15,
  });

  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    elapsedSeconds: 0,
    estimatedRemainingSeconds: 0,
    statusText: '',
  });

  const exporterRef = useRef<VideoExporter | null>(null);

  // Active media dimensions
  const activeMedia = activeTab === 'video' ? videoMetadata : imageMetadata;
  const currentWidth = activeMedia?.width || 1280;
  const currentHeight = activeMedia?.height || 720;

  // Compute target dimensions based on selected quality tier
  const { width: targetWidth, height: targetHeight, scaleFactor } = calculateTargetDimensions(
    currentWidth,
    currentHeight,
    selectedTier
  );

  const selectedPreset =
    RESOLUTION_PRESETS.find((p) => p.id === selectedTier) || RESOLUTION_PRESETS[5];

  const handleVideoLoaded = (data: VideoMetadata) => {
    setActiveTab('video');
    setVideoMetadata(data);
    setImageMetadata(null);

    // Auto-select a sensible upscale target based on source height
    if (data.height <= 360) {
      setSelectedTier('1080p');
    } else if (data.height <= 720) {
      setSelectedTier('4k');
    } else if (data.height <= 1080) {
      setSelectedTier('4k');
    } else {
      setSelectedTier('8k');
    }

    setProcessingState({
      isProcessing: false,
      progress: 0,
      elapsedSeconds: 0,
      estimatedRemainingSeconds: 0,
      statusText: '',
      downloadUrl: undefined,
      downloadFilename: undefined,
    });
  };

  const handleImageLoaded = (data: ImageMetadata) => {
    setActiveTab('image');
    setImageMetadata(data);
    setVideoMetadata(null);

    // Auto-select sensible upscale target for photos
    if (data.height <= 480) {
      setSelectedTier('1440p');
    } else if (data.height <= 1080) {
      setSelectedTier('4k');
    } else {
      setSelectedTier('8k');
    }
  };

  const handleResetMedia = () => {
    if (exporterRef.current) {
      exporterRef.current.cancel();
    }
    setVideoMetadata(null);
    setImageMetadata(null);
    setProcessingState({
      isProcessing: false,
      progress: 0,
      elapsedSeconds: 0,
      estimatedRemainingSeconds: 0,
      statusText: '',
    });
  };

  const handleStartExport = async () => {
    if (!videoMetadata) return;

    const exportVideo = document.createElement('video');
    exportVideo.src = videoMetadata.src;
    exportVideo.crossOrigin = 'anonymous';
    exportVideo.muted = true;
    exportVideo.playsInline = true;

    setProcessingState({
      isProcessing: true,
      progress: 1,
      elapsedSeconds: 0,
      estimatedRemainingSeconds: Math.round(videoMetadata.duration || 5),
      statusText: `Initializing fast WebGL export for ${targetHeight}p...`,
    });

    try {
      await new Promise<void>((resolve, reject) => {
        exportVideo.onloadedmetadata = () => resolve();
        exportVideo.onerror = () => reject(new Error('Failed to load video element for export'));
      });

      const exporter = new VideoExporter(exportVideo);
      exporterRef.current = exporter;

      await exporter.exportVideo(
        settings,
        targetWidth,
        targetHeight,
        selectedPreset.bitrateMbps,
        (progressUpdate) => {
          setProcessingState((prev) => ({
            ...prev,
            ...progressUpdate,
          }));
        }
      );
    } catch (err: any) {
      console.error('Export error:', err);
      setProcessingState((prev) => ({
        ...prev,
        isProcessing: false,
        error: err?.message || 'Processing failed. Please try a different resolution.',
        statusText: `Error: ${err?.message || 'Failed to export video'}`,
      }));
    }
  };

  const handleCancelExport = () => {
    if (exporterRef.current) {
      exporterRef.current.cancel();
    }
    setProcessingState({
      isProcessing: false,
      progress: 0,
      elapsedSeconds: 0,
      estimatedRemainingSeconds: 0,
      statusText: 'Processing cancelled.',
    });
  };

  const handleCaptureFrame = async () => {
    if (!videoMetadata) return;
    const tempVideo = document.createElement('video');
    tempVideo.src = videoMetadata.src;
    tempVideo.crossOrigin = 'anonymous';
    tempVideo.currentTime = 1;
    tempVideo.muted = true;

    await new Promise<void>((res) => {
      tempVideo.onseeked = () => res();
    });

    const exporter = new VideoExporter(tempVideo);
    try {
      const { url } = await exporter.captureFrame(settings, targetWidth, targetHeight);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SuperScale_Frame_${targetHeight}p_${Date.now()}.png`;
      a.click();
    } catch (err) {
      console.error('Frame capture failed:', err);
    }
  };

  const hasMedia = !!videoMetadata || !!imageMetadata;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      <Header onNewUpload={handleResetMedia} hasMedia={hasMedia} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-2 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Super-Resolution & Clarity Engine</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4 text-balance">
            Upscale Videos & Photos to <span className="text-cyan-400">8K Quality</span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Free, unlimited resolution enhancer from 144p to 8K. AI edge synthesis,
            unsharp masking, real-time split preview, and fast direct download—no credits needed.
          </p>
        </div>

        {/* State 1: No media loaded -> Uploader */}
        {!hasMedia && (
          <div className="my-8">
            <VideoUploader
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onVideoLoaded={handleVideoLoaded}
              onImageLoaded={handleImageLoaded}
            />
          </div>
        )}

        {/* State 2: Video Loaded */}
        {videoMetadata && (
          <div className="flex flex-col gap-6">
            {/* Video File Information Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-neutral-900/70 border border-neutral-800 rounded-xl text-xs text-neutral-400">
              <div className="flex items-center gap-2.5">
                <Film className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                  {videoMetadata.name}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-neutral-300 tabular-nums">
                  {videoMetadata.width} × {videoMetadata.height} ({videoMetadata.height}p)
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-neutral-300 tabular-nums">
                  {formatTime(videoMetadata.duration)}
                </span>
                {videoMetadata.sizeBytes && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-neutral-300 tabular-nums">
                      {formatBytes(videoMetadata.sizeBytes)}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Hardware Ready</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetMedia}
                  className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                >
                  Change Media
                </button>
              </div>
            </div>

            {/* Quality Selector (144p to 8K) */}
            <QualitySelector
              selectedTier={selectedTier}
              onSelectTier={setSelectedTier}
              metadata={videoMetadata}
            />

            {/* Real-time Interactive Split-Screen Comparison Player */}
            <ComparisonPlayer
              metadata={videoMetadata}
              settings={settings}
              targetWidth={targetWidth}
              targetHeight={targetHeight}
            />

            {/* AI Enhancement & Fine-Tuning Controls */}
            <EnhancementControls settings={settings} onChange={setSettings} />

            {/* Fast Export & Download Panel */}
            <ExportPanel
              processingState={processingState}
              selectedPreset={selectedPreset}
              targetWidth={targetWidth}
              targetHeight={targetHeight}
              onStartExport={handleStartExport}
              onCancelExport={handleCancelExport}
              onCaptureFrame={handleCaptureFrame}
            />
          </div>
        )}

        {/* State 3: Image Loaded */}
        {imageMetadata && (
          <div className="flex flex-col gap-6">
            {/* Image File Information Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-neutral-900/70 border border-neutral-800 rounded-xl text-xs text-neutral-400">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                  {imageMetadata.name}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-neutral-300 tabular-nums">
                  {imageMetadata.width} × {imageMetadata.height} ({imageMetadata.height}p)
                </span>
                {imageMetadata.sizeBytes && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-neutral-300 tabular-nums">
                      {formatBytes(imageMetadata.sizeBytes)}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Image Loaded</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetMedia}
                  className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                >
                  Change Media
                </button>
              </div>
            </div>

            {/* Quality Selector (144p to 8K) */}
            <QualitySelector
              selectedTier={selectedTier}
              onSelectTier={setSelectedTier}
              metadata={{
                src: imageMetadata.src,
                name: imageMetadata.name,
                duration: 0,
                width: imageMetadata.width,
                height: imageMetadata.height,
                aspectRatio: imageMetadata.aspectRatio,
                sizeBytes: imageMetadata.sizeBytes,
                format: imageMetadata.format,
              }}
            />

            {/* Interactive Image Split-Screen Comparison Player */}
            <ImageComparisonPlayer
              metadata={imageMetadata}
              settings={settings}
              targetWidth={targetWidth}
              targetHeight={targetHeight}
            />

            {/* AI Enhancement & Fine-Tuning Controls */}
            <EnhancementControls settings={settings} onChange={setSettings} />

            {/* Instant Image Export & Download Panel */}
            <ImageExportPanel
              metadata={imageMetadata}
              settings={settings}
              selectedPreset={selectedPreset}
              targetWidth={targetWidth}
              targetHeight={targetHeight}
            />
          </div>
        )}

        {/* Informative Guidance & Specifications */}
        <div className="mt-16 border-t border-neutral-800/80 pt-12">
          <ResolutionGuide />
          <FeaturesInfo />
          <FAQSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}
