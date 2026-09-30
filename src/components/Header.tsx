import React from 'react';
import { Sparkles, Video, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onNewUpload?: () => void;
  hasMedia?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onNewUpload, hasMedia }) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <a href="/" className="text-lg font-bold tracking-tight text-white flex items-center gap-2 hover:text-neutral-200 transition-colors">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          SuperScale AI
        </a>
        <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400 pl-3 border-l border-neutral-800">
          <span>Video & Photo</span>
          <span aria-hidden="true">·</span>
          <span>144p to 8K</span>
          <span aria-hidden="true">·</span>
          <span>100% Free & Unlimited</span>
        </div>
      </div>

      {/* Zone 2: 4 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
        <a href="#resolutions" className="hover:text-white transition-colors">Resolutions</a>
        <a href="#enhancement" className="hover:text-white transition-colors">AI Engine</a>
        <a href="#comparison" className="hover:text-white transition-colors">Compare Quality</a>
        <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        {hasMedia && (
          <button
            onClick={onNewUpload}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-700/60 rounded-md hover:bg-neutral-800 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            Upload New File
          </button>
        )}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Zero Credits Required</span>
        </div>
      </div>
    </header>
  );
};
