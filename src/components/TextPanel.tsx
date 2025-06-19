"use client";
import React, { useState, useRef, useEffect } from 'react';
import { TextStyle, FontOption } from '../lib/types';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { 
  Type, 
  Bold, 
  Italic, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Palette,
  Eye
} from 'lucide-react';

interface TextPanelProps {
  textStyle: TextStyle;
  onStyleChange: (style: Partial<TextStyle>) => void;
  isVisible: boolean;
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
  '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ff8000', '#8000ff',
  '#80ff00', '#0080ff', '#ff0080', '#808080', '#c0c0c0'
];

export const TextPanel: React.FC<TextPanelProps> = ({
  textStyle,
  onStyleChange,
  isVisible
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

  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 w-80 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-2xl z-50 transition-all duration-300 ease-out">
      <div className="flex items-center gap-2 mb-6">
        <Type className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Text Properties</h3>
      </div>

      {/* Font Family */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Font Family</label>
        <Select 
          value={textStyle.fontFamily} 
          onValueChange={(value) => onStyleChange({ fontFamily: value })}
        >
          <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            {FONT_OPTIONS.map((font) => (
              <SelectItem 
                key={font.family} 
                value={font.family}
                className="text-white hover:bg-gray-700"
                style={{ fontFamily: font.family }}
              >
                {font.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Size */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Font Size: {textStyle.fontSize}px
        </label>
        <Slider
          value={[textStyle.fontSize]}
          onValueChange={handleFontSizeChange}
          min={8}
          max={120}
          step={1}
          className="w-full"
        />
      </div>

      {/* Opacity */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Opacity: {Math.round(textStyle.opacity * 100)}%
        </label>
        <Slider
          value={[textStyle.opacity * 100]}
          onValueChange={handleOpacityChange}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
      </div>

      {/* Font Style Controls */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Style</label>
        <div className="flex gap-2">
          <Button
            variant={textStyle.fontWeight === 'bold' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onStyleChange({ 
              fontWeight: textStyle.fontWeight === 'bold' ? 'normal' : 'bold' 
            })}
            className="flex-1"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant={textStyle.fontStyle === 'italic' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onStyleChange({ 
              fontStyle: textStyle.fontStyle === 'italic' ? 'normal' : 'italic' 
            })}
            className="flex-1"
          >
            <Italic className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Text Alignment */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Alignment</label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((align) => (
            <Button
              key={align}
              variant={textStyle.textAlign === align ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStyleChange({ textAlign: align })}
              className="flex-1"
            >
              {align === 'left' && <AlignLeft className="w-4 h-4" />}
              {align === 'center' && <AlignCenter className="w-4 h-4" />}
              {align === 'right' && <AlignRight className="w-4 h-4" />}
            </Button>
          ))}
        </div>
      </div>

      {/* Color Picker */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Color
        </label>
        
        <div className="relative" ref={colorPickerRef}>
          <Button
            variant="outline"
            className="w-full h-10 border-gray-600 relative overflow-hidden"
            onClick={() => setColorPickerVisible(!colorPickerVisible)}
          >
            <div 
              className="absolute inset-0 rounded"
              style={{ 
                backgroundColor: textStyle.color,
                opacity: textStyle.opacity 
              }}
            />
            <span className="relative z-10 text-white mix-blend-difference">
              {textStyle.color.toUpperCase()}
            </span>
          </Button>

          {colorPickerVisible && (
            <div className="absolute top-12 left-0 w-full bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-xl z-50">
              {/* Preset Colors */}
              <div className="grid grid-cols-5 gap-2 mb-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded border-2 border-gray-600 hover:border-gray-400 transition-colors"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                  />
                ))}
              </div>

              {/* Custom Color Input */}
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={customColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-16 h-8 p-1 bg-gray-700 border-gray-600"
                />
                <Input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1 bg-gray-700 border-gray-600 text-white text-sm"
                  onBlur={() => handleColorChange(customColor)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleColorChange(customColor);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
        <label className="block text-sm font-medium text-gray-300 mb-2">Preview</label>
        <div 
          className="text-center py-2"
          style={{
            fontFamily: textStyle.fontFamily,
            fontSize: `${textStyle.fontSize}px`,
            color: hexToRgba(textStyle.color, textStyle.opacity),
            fontWeight: textStyle.fontWeight,
            fontStyle: textStyle.fontStyle,
            textAlign: textStyle.textAlign
          }}
        >
          Sample Text
        </div>
      </div>
    </div>
  );
}; 