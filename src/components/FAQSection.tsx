import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is SuperScale AI really 100% free with no credits?',
      a: 'Yes! SuperScale AI requires zero credits, zero account creation, and zero subscriptions. You can upscale as many videos as you want without payment or hidden quotas.',
    },
    {
      q: 'Will there be any watermark on my downloaded video?',
      a: 'No. The processed video is completely clean with zero watermarks or logos. You have full ownership of your exported files.',
    },
    {
      q: 'How does the AI quality enhancement make low-res videos look sharper?',
      a: 'The engine uses a 9-tap Laplacian edge kernel combined with high-frequency unsharp masking, adaptive midtone micro-contrast, and chroma de-artifacting executed directly on your GPU via WebGL shaders. This synthesizes crisp edge transitions and restores texture clarity.',
    },
    {
      q: 'Why is video processing so fast?',
      a: 'Because all frame rendering and shader computations run directly in your local browser using hardware acceleration (WebGL & MediaRecorder API), bypassing slow remote cloud queue uploads.',
    },
    {
      q: 'Are my videos uploaded to a server or kept private?',
      a: 'Your videos remain 100% private on your own device. They are processed entirely inside your local browser sandbox and never transferred to any remote server or stored in any cloud database.',
    },
  ];

  return (
    <section id="faq" className="w-full max-w-3xl mx-auto my-12 px-4">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          Frequently Asked Questions
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Everything you need to know about video upscaling, formats, and performance.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="border border-neutral-800 rounded-xl bg-neutral-900/40 overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-neutral-800/40 transition-colors"
              >
                <span className="text-sm font-semibold text-white">{faq.q}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0 ml-2" />
                )}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-xs text-neutral-400 leading-relaxed border-t border-neutral-800/60">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
