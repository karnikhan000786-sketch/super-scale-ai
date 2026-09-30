import React from 'react';
import { Cpu, Zap, ShieldCheck, Sliders, Layers, Eye } from 'lucide-react';

export const FeaturesInfo: React.FC = () => {
  const features = [
    {
      icon: Cpu,
      title: 'WebGL GPU Super-Resolution',
      desc: 'Hardware-accelerated fragment shaders perform 9-tap Laplacian edge isolation, high-frequency texture synthesis, and unsharp masking at 60 FPS.',
    },
    {
      icon: Zap,
      title: 'Instant Fast Processing',
      desc: 'No queue waiting or remote rendering lag. High-speed client-side recording pipes enhanced frames directly to your browser memory.',
    },
    {
      icon: ShieldCheck,
      title: '100% Free & No Credits',
      desc: 'No credit balance, no subscriptions, no daily limits, and no watermark stamped onto your videos. Completely unrestricted.',
    },
    {
      icon: Eye,
      title: 'Real-Time Split Preview',
      desc: 'Inspect the difference instantly with an interactive swipe slider. Compare raw original pixels side-by-side with AI-enhanced clarity.',
    },
    {
      icon: Layers,
      title: 'Preserves Original Aspect Ratio',
      desc: 'Supports vertical 9:16 reels, 16:9 widescreen, 4:3 vintage, and square 1:1 videos without stretching or distortion.',
    },
    {
      icon: Sliders,
      title: 'Customizable Clarity Engine',
      desc: 'Tailor sharpening strength, edge boost, midtone micro-contrast, and noise suppression with intuitive real-time sliders.',
    },
  ];

  return (
    <section id="engine" className="w-full max-w-5xl mx-auto my-12 px-4">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-white tracking-tight">
          High-Speed Video Enhancement Architecture
        </h2>
        <p className="text-xs text-neutral-400 mt-1 max-w-lg mx-auto">
          Built with modern WebGL shaders and MediaStream APIs for instant, private in-browser upscaling.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900/70 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1.5">{f.title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">{f.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
