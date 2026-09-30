import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-neutral-800/80 bg-neutral-950 py-8 px-6 text-xs text-neutral-500">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-300">SuperScale AI</span>
          <span aria-hidden="true">·</span>
          <span>Free Video Resolution Enhancer & Upscaler (144p to 8K)</span>
        </div>

        <div className="flex items-center gap-4">
          <a href="#resolutions" className="hover:text-neutral-300 transition-colors">
            Resolutions
          </a>
          <a href="#engine" className="hover:text-neutral-300 transition-colors">
            AI Engine
          </a>
          <a href="#comparison" className="hover:text-neutral-300 transition-colors">
            Compare
          </a>
          <a href="#faq" className="hover:text-neutral-300 transition-colors">
            FAQ
          </a>
        </div>
      </div>
    </footer>
  );
};
