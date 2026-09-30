import React, { useState } from 'react';
import { EnhancementSettings } from '../types';
import { Sliders, Sparkles, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface EnhancementControlsProps {
  settings: EnhancementSettings;
  onChange: (settings: EnhancementSettings) => void;
}

export const EnhancementControls: React.FC<EnhancementControlsProps> = ({
  settings,
  onChange,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const presets = [
    {
      id: 'clarity',
      name: 'Super Clarity',
      desc: 'Crisp edges & texture synthesis',
      values: {
        preset: 'clarity' as const,
        sharpness: 130,
        edgeBoost: 75,
        microContrast: 60,
        saturation: 110,
        brightness: 102,
        denoise: 15,
      },
    },
    {
      id: 'cinema',
      name: 'Cinema 4K Restore',
      desc: 'Balanced cinematic contrast & sharpness',
      values: {
        preset: 'cinema' as const,
        sharpness: 100,
        edgeBoost: 50,
        microContrast: 45,
        saturation: 105,
        brightness: 100,
        denoise: 25,
      },
    },
    {
      id: 'vivid',
      name: 'Vivid & Dynamic',
      desc: 'Deep colors & punchy dynamic range',
      values: {
        preset: 'vivid' as const,
        sharpness: 115,
        edgeBoost: 60,
        microContrast: 70,
        saturation: 125,
        brightness: 104,
        denoise: 20,
      },
    },
    {
      id: 'smooth',
      name: 'Smooth & De-noise',
      desc: 'Removes compression artifacts & grain',
      values: {
        preset: 'smooth' as const,
        sharpness: 85,
        edgeBoost: 40,
        microContrast: 35,
        saturation: 102,
        brightness: 100,
        denoise: 65,
      },
    },
  ];

  const handlePresetSelect = (presetValues: EnhancementSettings) => {
    onChange(presetValues);
  };

  const handleSliderChange = (key: keyof EnhancementSettings, value: number) => {
    onChange({
      ...settings,
      preset: 'custom',
      [key]: value,
    });
  };

  const handleReset = () => {
    onChange({
      preset: 'clarity',
      sharpness: 130,
      edgeBoost: 75,
      microContrast: 60,
      saturation: 110,
      brightness: 102,
      denoise: 15,
    });
  };

  return (
    <div id="enhancement" className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            AI Clarity & Super-Resolution Tuning
          </h3>
          <p className="text-xs text-neutral-400">
            Choose an AI enhancement profile or fine-tune edge contrast and sharpness shaders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-neutral-400 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 rounded transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 rounded transition-colors"
          >
            <Sliders className="w-3 h-3" />
            <span>{showAdvanced ? 'Hide Fine-Tune' : 'Fine-Tune Sliders'}</span>
            {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Preset Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {presets.map((p) => {
          const isSelected = settings.preset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePresetSelect(p.values)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-950/30 ring-1 ring-cyan-400/40'
                  : 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-white">{p.name}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
              </div>
              <p className="text-[11px] text-neutral-400 line-clamp-1">{p.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Collapsible Manual Sliders */}
      {showAdvanced && (
        <div className="mt-5 pt-4 border-t border-neutral-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Sharpness */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-300 font-medium">Sharpness (Laplacian)</span>
              <span className="font-mono text-cyan-400 tabular-nums">{settings.sharpness}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={220}
              value={settings.sharpness}
              onChange={(e) => handleSliderChange('sharpness', Number(e.target.value))}
              className="h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Edge Boost */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-300 font-medium">Edge Detail Synthesizer</span>
              <span className="font-mono text-cyan-400 tabular-nums">{settings.edgeBoost}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={150}
              value={settings.edgeBoost}
              onChange={(e) => handleSliderChange('edgeBoost', Number(e.target.value))}
              className="h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Micro Contrast */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-300 font-medium">Midtone Clarity</span>
              <span className="font-mono text-cyan-400 tabular-nums">{settings.microContrast}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.microContrast}
              onChange={(e) => handleSliderChange('microContrast', Number(e.target.value))}
              className="h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Saturation */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-300 font-medium">Color Vibrancy</span>
              <span className="font-mono text-cyan-400 tabular-nums">{settings.saturation}%</span>
            </div>
            <input
              type="range"
              min={80}
              max={150}
              value={settings.saturation}
              onChange={(e) => handleSliderChange('saturation', Number(e.target.value))}
              className="h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Brightness */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-300 font-medium">Gamma & Brightness</span>
              <span className="font-mono text-cyan-400 tabular-nums">{settings.brightness}%</span>
            </div>
            <input
              type="range"
              min={90}
              max={120}
              value={settings.brightness}
              onChange={(e) => handleSliderChange('brightness', Number(e.target.value))}
              className="h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* De-noise */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-300 font-medium">Artifact Suppression</span>
              <span className="font-mono text-cyan-400 tabular-nums">{settings.denoise}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.denoise}
              onChange={(e) => handleSliderChange('denoise', Number(e.target.value))}
              className="h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      )}
    </div>
  );
};
