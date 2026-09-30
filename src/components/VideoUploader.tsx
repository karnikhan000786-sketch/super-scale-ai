import React, { useRef, useState } from 'react';
import { UploadCloud, Film, Image as ImageIcon, PlayCircle, Loader2 } from 'lucide-react';
import { ImageMetadata, MediaType, VideoMetadata } from '../types';
import { SAMPLE_VIDEOS } from '../utils/sampleVideos';
import { SAMPLE_IMAGES } from '../utils/sampleImages';

interface MediaUploaderProps {
  activeTab: MediaType;
  onTabChange: (tab: MediaType) => void;
  onVideoLoaded: (metadata: VideoMetadata) => void;
  onImageLoaded: (metadata: ImageMetadata) => void;
}

export const VideoUploader: React.FC<MediaUploaderProps> = ({
  activeTab,
  onTabChange,
  onVideoLoaded,
  onImageLoaded,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|avif|bmp)$/i.test(file.name);
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(file.name);

    if (isImage) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        onTabChange('image');
        onImageLoaded({
          file,
          src: url,
          name: file.name,
          width: img.naturalWidth || 640,
          height: img.naturalHeight || 480,
          aspectRatio: (img.naturalWidth || 640) / (img.naturalHeight || 480),
          sizeBytes: file.size,
          format: file.type || 'image/jpeg',
        });
      };
      img.src = url;
    } else if (isVideo) {
      const url = URL.createObjectURL(file);
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = url;

      tempVideo.onloadedmetadata = () => {
        onTabChange('video');
        onVideoLoaded({
          file,
          src: url,
          name: file.name,
          duration: tempVideo.duration || 0,
          width: tempVideo.videoWidth || 640,
          height: tempVideo.videoHeight || 360,
          aspectRatio: (tempVideo.videoWidth || 640) / (tempVideo.videoHeight || 360),
          sizeBytes: file.size,
          format: file.type || 'video/mp4',
        });
      };
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleVideoSampleSelect = async (sample: (typeof SAMPLE_VIDEOS)[0]) => {
    if (!sample.generateBlob) return;
    setIsLoadingSample(sample.id);
    try {
      const { blob, url, width, height } = await sample.generateBlob();
      const mockFile = new File([blob], `${sample.id}.webm`, { type: 'video/webm' });
      onTabChange('video');
      onVideoLoaded({
        file: mockFile,
        src: url,
        name: `${sample.name}.webm`,
        duration: 5,
        width,
        height,
        aspectRatio: width / height,
        sizeBytes: blob.size,
        format: 'video/webm',
      });
    } catch (err) {
      console.error('Failed to load sample video:', err);
    } finally {
      setIsLoadingSample(null);
    }
  };

  const handleImageSampleSelect = async (sample: (typeof SAMPLE_IMAGES)[0]) => {
    setIsLoadingSample(sample.id);
    try {
      const { blob, url, width, height } = await sample.generateBlob();
      const mockFile = new File([blob], `${sample.id}.jpg`, { type: 'image/jpeg' });
      onTabChange('image');
      onImageLoaded({
        file: mockFile,
        src: url,
        name: `${sample.name}.jpg`,
        width,
        height,
        aspectRatio: width / height,
        sizeBytes: blob.size,
        format: 'image/jpeg',
      });
    } catch (err) {
      console.error('Failed to load sample image:', err);
    } finally {
      setIsLoadingSample(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4">
      {/* Mode Selector Tabs */}
      <div className="flex items-center justify-center mb-5">
        <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
          <button
            type="button"
            onClick={() => onTabChange('video')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'video'
                ? 'bg-neutral-800 text-cyan-400 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Video Enhancer (144p to 8K)</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('image')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'image'
                ? 'bg-neutral-800 text-cyan-400 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Image / Photo Enhancer</span>
          </button>
        </div>
      </div>

      {/* Upload Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 group ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 hover:bg-neutral-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={
            activeTab === 'video'
              ? 'video/*,.mp4,.webm,.mov,.mkv,.avi,.m4v'
              : 'image/*,.jpg,.jpeg,.png,.webp,.avif,.bmp'
          }
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-neutral-800/80 border border-neutral-700 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:border-cyan-500/50 transition-all">
            {activeTab === 'video' ? (
              <Film className="w-7 h-7 text-neutral-300 group-hover:text-cyan-400 transition-colors" />
            ) : (
              <ImageIcon className="w-7 h-7 text-neutral-300 group-hover:text-cyan-400 transition-colors" />
            )}
          </div>

          <h3 className="text-lg font-semibold text-white mb-2">
            {activeTab === 'video'
              ? 'Upload Video to Upscale or Downscale'
              : 'Upload Image / Photo to Upscale & Enhance'}
          </h3>
          <p className="text-sm text-neutral-400 mb-4 max-w-md">
            {activeTab === 'video'
              ? 'Drag and drop your video file here, or click to browse. Supports MP4, WebM, MOV, MKV.'
              : 'Drag and drop your photo or image here, or click to browse. Supports JPG, PNG, WebP.'}
          </p>

          <button
            type="button"
            className="px-5 py-2.5 text-sm font-semibold text-neutral-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            {activeTab === 'video' ? 'Select Video File' : 'Select Image File'}
          </button>

          {/* Clean Metadata without pills */}
          <div className="flex items-center gap-2 text-xs text-neutral-500 mt-6">
            <span>Instant GPU AI Processing</span>
            <span aria-hidden="true">·</span>
            <span>100% Free & Unlimited</span>
            <span aria-hidden="true">·</span>
            <span>No Watermark</span>
          </div>
        </div>
      </div>

      {/* Instant Samples Bar */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-neutral-900/60 border border-neutral-800/80 rounded-lg">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <PlayCircle className="w-4 h-4 text-neutral-400" />
          <span>
            {activeTab === 'video'
              ? 'No video file? Test right now with ready video samples:'
              : 'No image file? Test right now with ready photo samples:'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'video' ? (
            SAMPLE_VIDEOS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                disabled={isLoadingSample !== null}
                onClick={(e) => {
                  e.stopPropagation();
                  handleVideoSampleSelect(sample);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800/90 hover:bg-neutral-700 border border-neutral-700/60 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLoadingSample === sample.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                ) : (
                  <Film className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>{sample.name}</span>
              </button>
            ))
          ) : (
            SAMPLE_IMAGES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                disabled={isLoadingSample !== null}
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageSampleSelect(sample);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800/90 hover:bg-neutral-700 border border-neutral-700/60 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLoadingSample === sample.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>{sample.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
