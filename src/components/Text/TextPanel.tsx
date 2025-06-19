"use client";
import React, { useState, useRef, useEffect } from 'react';
import { TextStyle, FontOption } from '../../lib/types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { 
  Type, 
  Bold, 
  Italic, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Palette,
  Eye,
  Copy,
  Trash2,
  Sparkles,
  Zap,
  Star,
  Heart
} from 'lucide-react';

interface TextPanelProps {
  textStyle: TextStyle;
  onStyleChange: (style: Partial<TextStyle>) => void;
  isVisible: boolean;
  selectedTextId?: string | null;
  onDuplicateText?: () => void;
  onClearAllText?: () => void;
}

const FONT_OPTIONS: FontOption[] = [
  { name: 'Inter', family: 'Inter, sans-serif', category: 'sans-serif' },
  { name: 'Roboto', family: 'Roboto, sans-serif', category: 'sans-serif' },
  { name: 'Helvetica', family: 'Helvetica, Arial, sans-serif', category: 'sans-serif' },
  { name: 'Times New Roman', family: 'Times New Roman, serif', category: 'serif' },
  { name: 'Georgia', family: 'Georgia, serif', category: 'serif' },
  { name: 'Playfair Display', family: 'Playfair Display, serif', category: 'serif' },
  { name: 'Monaco', family: 'Monaco, monospace', category: 'monospace' },
  { name: 'Fira Code', family: 'Fira Code, monospace', category: 'monospace' },
  { name: 'JetBrains Mono', family: 'JetBrains Mono, monospace', category: 'monospace' },
  { name: 'Caveat', family: 'Caveat, cursive', category: 'handwriting' },
  { name: 'Dancing Script', family: 'Dancing Script, cursive', category: 'handwriting' },
  { name: 'Oswald', family: 'Oswald, sans-serif', category: 'display' },
  { name: 'Bebas Neue', family: 'Bebas Neue, display', category: 'display' },
];

const PRESET_COLORS = [
  '#ffffff', '#000000', '#ff6b6b', '#4ecdc4', '#45b7d1', 
  '#f9ca24', '#6c5ce7', '#fd79a8', '#636e72', '#a0a0a0',
  '#00d2d3', '#ff7675', '#74b9ff', '#fd63c6', '#fdcb6e'
];

const TEXT_STYLES = [
  { name: 'Heading', fontSize: 32, fontWeight: 'bold' as const, color: '#ffffff' },
  { name: 'Subheading', fontSize: 24, fontWeight: 'bold' as const, color: '#a0a0a0' },
  { name: 'Body', fontSize: 16, fontWeight: 'normal' as const, color: '#ffffff' },
  { name: 'Caption', fontSize: 12, fontWeight: 'normal' as const, color: '#636e72' },
];

const MAGIC_EFFECTS = [
  {
    name: 'Neon Glow',
    icon: Sparkles,
    style: { color: '#00d2d3', fontWeight: 'bold' as const, fontSize: 20 }
  },
  {
    name: 'Fire Text',
    icon: Zap,
    style: { color: '#ff6b6b', fontWeight: 'bold' as const, fontSize: 24 }
  },
  {
    name: 'Gold Shine',
    icon: Star,
    style: { color: '#fdcb6e', fontWeight: 'bold' as const, fontSize: 18 }
  },
  {
    name: 'Love Note',
    icon: Heart,
    style: { color: '#fd79a8', fontStyle: 'italic' as const, fontSize: 16 }
  }
];

export const TextPanel: React.FC<TextPanelProps> = ({
  textStyle,
  onStyleChange,
  isVisible,
  selectedTextId,
  onDuplicateText,
  onClearAllText
}) => {
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [customColor, setCustomColor] = useState(textStyle.color);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setColorPickerVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFontSizeChange = (values: number[]) => {
    onStyleChange({ fontSize: values[0] });
  };

  const handleOpacityChange = (values: number[]) => {
    onStyleChange({ opacity: values[0] / 100 });
  };

  const handleColorChange = (color: string) => {
    setCustomColor(color);
    onStyleChange({ color });
  };

  const applyTextStyle = (style: typeof TEXT_STYLES[0]) => {
    onStyleChange({
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      color: style.color,
    });
  };

  const applyMagicEffect = (effect: typeof MAGIC_EFFECTS[0]) => {
    onStyleChange(effect.style);
  };

  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  if (!isVisible) return null;

  return (
    <div className="text-panel fixed left-4 top-1/2 -translate-y-1/2 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl z-50 transition-all duration-300 ease-out max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b border-gray-700/50">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
          <Type className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Text Studio</h3>
          <p className="text-xs text-gray-400">Professional typography</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Actions */}
        {selectedTextId && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">Quick Actions</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onDuplicateText}
                className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200"
              >
                <Copy className="w-3 h-3 mr-2" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAllText}
                className="bg-red-900/20 border-red-600/50 text-red-400 hover:bg-red-800/30 hover:text-red-300 transition-all duration-200"
              >
                <Trash2 className="w-3 h-3 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        )}

        {/* Text Styles */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">Text Styles</label>
          <div className="grid grid-cols-2 gap-2">
            {TEXT_STYLES.map((style) => (
              <Button
                key={style.name}
                variant="outline"
                size="sm"
                onClick={() => applyTextStyle(style)}
                className="bg-gray-800/30 border-gray-600/50 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200 justify-start h-10"
                style={{ 
                  color: style.color,
                  fontWeight: style.fontWeight,
                  fontSize: '12px'
                }}
              >
                {style.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Magic Effects - Surprise Feature! */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Magic Effects
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MAGIC_EFFECTS.map((effect) => (
              <Button
                key={effect.name}
                variant="outline"
                size="sm"
                onClick={() => applyMagicEffect(effect)}
                className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-600/30 text-purple-300 hover:from-purple-800/30 hover:to-pink-800/30 hover:text-purple-200 transition-all duration-200 justify-start h-10"
              >
                <effect.icon className="w-3 h-3 mr-2" />
                <span className="text-xs">{effect.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Font Family */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">Font Family</label>
          <select
            value={textStyle.fontFamily}
            onChange={(e) => onStyleChange({ fontFamily: e.target.value })}
            className="w-full bg-gray-800/50 border border-gray-600/50 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            {FONT_OPTIONS.map((font) => (
              <option
                key={font.family}
                value={font.family}
                style={{ fontFamily: font.family }}
                className="bg-gray-800 text-white"
              >
                {font.name}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            Font Size: <span className="text-blue-400 font-bold">{textStyle.fontSize}px</span>
          </label>
          <div className="flex gap-2 mb-3">
            {[12, 16, 20, 24, 32, 48].map(size => (
              <Button
                key={size}
                variant={textStyle.fontSize === size ? 'default' : 'outline'}
                size="sm"
                onClick={() => onStyleChange({ fontSize: size })}
                className={`text-xs px-3 py-2 transition-all duration-200 ${
                  textStyle.fontSize === size 
                    ? 'bg-blue-600 text-white border-blue-500' 
                    : 'bg-gray-800/50 border-gray-600/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                {size}
              </Button>
            ))}
          </div>
          <Slider
            value={[textStyle.fontSize]}
            onValueChange={handleFontSizeChange}
            min={8}
            max={120}
            step={1}
            className="w-full"
          />
        </div>

        {/* Style Controls */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">Text Style</label>
          <div className="flex gap-2">
            <Button
              variant={textStyle.fontWeight === 'bold' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStyleChange({ 
                fontWeight: textStyle.fontWeight === 'bold' ? 'normal' : 'bold' 
              })}
              className={`flex-1 transition-all duration-200 ${
                textStyle.fontWeight === 'bold'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-gray-800/50 border-gray-600/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <Bold className="w-4 h-4 mr-2" />
              Bold
            </Button>
            <Button
              variant={textStyle.fontStyle === 'italic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStyleChange({ 
                fontStyle: textStyle.fontStyle === 'italic' ? 'normal' : 'italic' 
              })}
              className={`flex-1 transition-all duration-200 ${
                textStyle.fontStyle === 'italic'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-gray-800/50 border-gray-600/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <Italic className="w-4 h-4 mr-2" />
              Italic
            </Button>
          </div>
        </div>

        {/* Text Alignment */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">Text Alignment</label>
          <div className="flex gap-1">
            {(['left', 'center', 'right'] as const).map((align) => (
              <Button
                key={align}
                variant={textStyle.textAlign === align ? 'default' : 'outline'}
                size="sm"
                onClick={() => onStyleChange({ textAlign: align })}
                className={`flex-1 transition-all duration-200 ${
                  textStyle.textAlign === align
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-gray-800/50 border-gray-600/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                {align === 'left' && <AlignLeft className="w-4 h-4" />}
                {align === 'center' && <AlignCenter className="w-4 h-4" />}
                {align === 'right' && <AlignRight className="w-4 h-4" />}
              </Button>
            ))}
          </div>
        </div>

        {/* Color Picker */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Color Palette
          </label>
          
          <div className="grid grid-cols-5 gap-2 mb-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                className={`w-10 h-10 rounded-lg border-2 hover:scale-110 transition-all duration-200 ${
                  textStyle.color === color ? 'border-blue-400 scale-110 ring-2 ring-blue-400/30' : 'border-gray-600/50'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color)}
              />
            ))}
          </div>

          <div className="relative" ref={colorPickerRef}>
            <Button
              variant="outline"
              className="w-full h-12 border-gray-600/50 bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200"
              onClick={() => setColorPickerVisible(!colorPickerVisible)}
            >
              <div 
                className="w-6 h-6 rounded-lg mr-3 border border-gray-500"
                style={{ backgroundColor: textStyle.color }}
              />
              <span className="text-gray-300">{textStyle.color.toUpperCase()}</span>
            </Button>

            {colorPickerVisible && (
              <div className="absolute top-14 left-0 w-full bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-xl z-50">
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={customColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-16 h-10 p-1 bg-gray-700 border-gray-600"
                  />
                  <Input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1 bg-gray-700 border-gray-600 text-white"
                    onBlur={() => handleColorChange(customColor)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Opacity */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Opacity: <span className="text-blue-400 font-bold">{Math.round(textStyle.opacity * 100)}%</span>
          </label>
          <Slider
            value={[textStyle.opacity * 100]}
            onValueChange={handleOpacityChange}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
        </div>

        {/* Live Preview */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">Live Preview</label>
          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-600/50">
            <div 
              className="text-center py-3"
              style={{
                fontFamily: textStyle.fontFamily,
                fontSize: `${Math.min(textStyle.fontSize, 24)}px`,
                color: hexToRgba(textStyle.color, textStyle.opacity),
                fontWeight: textStyle.fontWeight,
                fontStyle: textStyle.fontStyle,
                textAlign: textStyle.textAlign
              }}
            >
              The Quick Brown Fox
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 