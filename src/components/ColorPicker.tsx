"use client";
import React, { useState } from "react";
import { Palette, X, Check } from "lucide-react";

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorChange,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [currentPalette, setCurrentPalette] = useState<keyof typeof colorPalettes>('Default');
  const [customColor, setCustomColor] = useState<string>('#ff6b6b');
  const [recentColors, setRecentColors] = useState<string[]>([]);

  const colorPalettes = {
    'Default': {
      name: 'Default',
      colors: [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
        '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
        '#ffd93d', '#6c5ce7', '#a29bfe', '#fd79a8', '#e17055',
        '#00b894', '#e84393', '#0984e3', '#fdcb6e', '#dda0dd'
      ]
    },
    'Neon': {
      name: 'Neon',
      colors: [
        '#ff0080', '#00ff80', '#8000ff', '#ff8000', '#0080ff',
        '#80ff00', '#ff0040', '#40ff00', '#0040ff', '#ff4000',
        '#00ff40', '#4000ff', '#ff8040', '#80ff40', '#4080ff',
        '#ff4080', '#80ff80', '#8080ff', '#ffff00', '#ff00ff'
      ]
    },
    'Pastel': {
      name: 'Pastel',
      colors: [
        '#ffd1dc', '#e0bbe4', '#957dad', '#d291bc', '#fec8d8',
        '#a8e6cf', '#dcedc1', '#c7ceea', '#b19cd9', '#ff9aa2',
        '#ffb7b2', '#ffdac1', '#e2f0cb', '#b5ead7', '#c7ceea',
        '#f8d7da', '#d4edda', '#d1ecf1', '#fff3cd', '#f4cccc'
      ]
    },
    'Dark': {
      name: 'Dark',
      colors: [
        '#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7',
        '#1a252f', '#2c3e50', '#34495e', '#4a6741', '#52796f',
        '#84a59d', '#f6f4d2', '#cad2c5', '#52796f', '#354f52',
        '#2f3e46', '#84a98c', '#cad2c5', '#a4ac86', '#656d4a'
      ]
    }
  };

  const isValidHex = (hex: string): boolean => {
    const regex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
    return regex.test(hex);
  };

  const handleColorChange = (color: string) => {
    onColorChange(color);
    if (!recentColors.includes(color)) {
      setRecentColors([color, ...recentColors.slice(0, 4)]);
    }
  };

  const tabs = [
    { id: 'preset' as const, label: 'Presets', icon: Palette },
    { id: 'custom' as const, label: 'Custom', icon: X }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      {/* Color Picker Panel - Responsive */}
      <div className={`
        fixed z-50 transition-all duration-300 ease-out
        ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95 pointer-events-none'}
        bottom-4 left-4 right-4 sm:bottom-auto sm:top-20 sm:right-4 sm:left-auto sm:w-80
      `}>
        <div className="bg-black/90 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              <span className="text-white font-semibold text-sm sm:text-base">Color Picker</span>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4 text-white/70" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'preset' | 'custom')}
                className={`
                  flex-1 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200
                  ${activeTab === tab.id
                    ? 'text-cyan-400 bg-cyan-500/10 border-b-2 border-cyan-400'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-3 sm:p-4 max-h-64 sm:max-h-80 overflow-y-auto">
            {activeTab === 'preset' && (
              <div className="space-y-3 sm:space-y-4">
                {/* Current Color Display */}
                <div className="flex items-center gap-3 p-2 sm:p-3 rounded-lg bg-white/5 border border-white/10">
                  <div 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 border-white/30 shadow-lg"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <div>
                    <div className="text-white text-xs sm:text-sm font-medium">Current Color</div>
                    <div className="text-white/60 text-xs font-mono">{selectedColor}</div>
                  </div>
                </div>

                {/* Color Palette Selector */}
                <div className="space-y-2">
                  <label className="text-white/80 text-xs sm:text-sm font-medium">Palette:</label>
                  <select
                    value={currentPalette}
                    onChange={(e) => setCurrentPalette(e.target.value as keyof typeof colorPalettes)}
                    className="w-full px-2 py-1 sm:px-3 sm:py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  >
                    {Object.entries(colorPalettes).map(([key, palette]) => (
                      <option key={key} value={key} className="bg-gray-800">
                        {palette.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color Grid */}
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 sm:gap-2">
                  {colorPalettes[currentPalette].colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`
                        relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg transition-all duration-200 
                        hover:scale-110 hover:shadow-lg group
                        ${selectedColor === color 
                          ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-black/50 scale-105' 
                          : 'hover:ring-1 hover:ring-white/30'
                        }
                      `}
                      style={{ backgroundColor: color }}
                      title={color}
                    >
                      {selectedColor === color && (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white absolute inset-0 m-auto drop-shadow-lg" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'custom' && (
              <div className="space-y-3 sm:space-y-4">
                {/* Color Input */}
                <div className="space-y-2">
                  <label className="text-white/80 text-xs sm:text-sm font-medium">Hex Color:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      placeholder="#FF0000"
                      className="flex-1 px-2 py-1 sm:px-3 sm:py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    />
                    <button
                      onClick={() => handleColorChange(customColor)}
                      disabled={!isValidHex(customColor)}
                      className="px-3 py-1 sm:px-4 sm:py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white text-xs sm:text-sm font-medium transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Color Preview */}
                <div className="p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg border-2 border-white/30"
                      style={{ backgroundColor: isValidHex(customColor) ? customColor : '#666' }}
                    />
                    <div>
                      <div className="text-white text-xs sm:text-sm font-medium">Preview</div>
                      <div className="text-white/60 text-xs">
                        {isValidHex(customColor) ? 'Valid color' : 'Invalid hex format'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Colors */}
                {recentColors.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-white/80 text-xs sm:text-sm font-medium">Recent Colors:</label>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 sm:gap-2">
                      {recentColors.map((color, index) => (
                        <button
                          key={index}
                          onClick={() => handleColorChange(color)}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg hover:scale-110 transition-transform hover:ring-1 hover:ring-white/30"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer with Actions */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-t border-white/10 bg-white/5">
            <div className="text-white/60 text-xs">
              Selected: <span className="text-cyan-400 font-mono">{selectedColor}</span>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs sm:text-sm font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ColorPicker; 