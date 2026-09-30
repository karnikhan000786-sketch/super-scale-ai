import React from 'react';
import { RESOLUTION_PRESETS } from '../utils/resolutionPresets';
import { Sparkles, Monitor, Tv, Smartphone } from 'lucide-react';

export const ResolutionGuide: React.FC = () => {
  return (
    <section className="w-full max-w-5xl mx-auto my-12 px-4">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-white tracking-tight">
          Supported Resolutions (144p to 8K)
        </h2>
        <p className="text-xs text-neutral-400 mt-1 max-w-lg mx-auto">
          Full range of video resolutions for every use case—from ultra-lightweight mobile clips to pristine 8K cinema master files.
        </p>
      </div>

      <div className="overflow-x-auto border border-neutral-800 rounded-xl bg-neutral-900/40">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/80 text-neutral-400">
              <th className="py-3 px-4 font-semibold">Tier</th>
              <th className="py-3 px-4 font-semibold">Resolution</th>
              <th className="py-3 px-4 font-semibold">Aspect Ratio</th>
              <th className="py-3 px-4 font-semibold">Target Bitrate</th>
              <th className="py-3 px-4 font-semibold">Best Suited For</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
            {RESOLUTION_PRESETS.map((p) => (
              <tr key={p.id} className="hover:bg-neutral-800/40 transition-colors">
                <td className="py-3 px-4 font-bold text-white font-mono">{p.label}</td>
                <td className="py-3 px-4 font-mono tabular-nums text-neutral-300">
                  {p.standardWidth} × {p.targetHeight}
                </td>
                <td className="py-3 px-4 text-neutral-400">16:9 / Auto</td>
                <td className="py-3 px-4 font-mono tabular-nums text-cyan-400">
                  ~{p.bitrateMbps} Mbps
                </td>
                <td className="py-3 px-4 text-neutral-400">
                  {p.id === '144p' && 'Low-bandwidth messaging, compact email previews'}
                  {p.id === '240p' && 'Data saver mode, small thumbnail previews'}
                  {p.id === '360p' && 'Standard mobile web clips, fast streaming'}
                  {p.id === '480p' && 'SD DVD quality, legacy media enhancement'}
                  {p.id === '720p' && 'Standard HD, social media feeds, YouTube'}
                  {p.id === '1080p' && 'Full HD standard for desktops, tablets, and phones'}
                  {p.id === '1440p' && '2K Quad HD monitors and high-DPI laptops'}
                  {p.id === '4k' && '4K Smart TVs, cinema presentation, pristine detail'}
                  {p.id === '8k' && '8K Displays, extreme high-fidelity archival mastering'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
