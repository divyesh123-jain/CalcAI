"use client";
import React, { useState, useRef } from "react";
import { 
  Settings, 
  Palette, 
  Grid3X3, 
  Download, 
  Upload, 
  RotateCw, 
  Layers,
  Ruler,
  X,
  Camera,
  Share,
  Save,
  FileImage,
  Maximize,
  Eye,
  EyeOff,
  RefreshCw
} from "lucide-react";

interface CanvasSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  canvasBackgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  onReset?: () => void;
}

const CanvasSettings: React.FC<CanvasSettingsProps> = ({
  isOpen,
  onClose,
  canvasBackgroundColor,
  onBackgroundColorChange,
  showGrid = true,
  onToggleGrid,
  canvasRef,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'export' | 'advanced'>('appearance');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const backgroundColors = [
    { name: "Black", value: "#000000" },
    { name: "White", value: "#ffffff" },
    { name: "Dark Gray", value: "#1a1a1a" },
    { name: "Light Gray", value: "#f5f5f5" },
    { name: "Navy", value: "#0f172a" },
    { name: "Dark Blue", value: "#1e293b" },
    { name: "Deep Purple", value: "#1e1b4b" },
    { name: "Forest Green", value: "#14532d" },
    { name: "Maroon", value: "#7f1d1d" },
    { name: "Custom", value: "custom" }
  ];

  const exportCanvas = (format: 'png' | 'jpg' | 'svg') => {
    if (!canvasRef?.current) return;
    
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    
    if (format === 'svg') {
      // Create SVG export (simplified version)
      const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
        <rect width="100%" height="100%" fill="${canvasBackgroundColor}"/>
        <image href="${canvas.toDataURL()}" width="100%" height="100%"/>
      </svg>`;
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      link.href = URL.createObjectURL(blob);
      link.download = `canvas-drawing.svg`;
    } else {
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      link.href = canvas.toDataURL(mimeType, 0.9);
      link.download = `canvas-drawing.${format}`;
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvasRef?.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Scale image to fit canvas while maintaining aspect ratio
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;
      
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    };
    img.src = URL.createObjectURL(file);
  };

  const copyCanvasToClipboard = async () => {
    if (!canvasRef?.current) return;
    
    try {
      const canvas = canvasRef.current;
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          // You could add a toast notification here
        }
      });
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-black/90 border border-white/20 rounded-2xl shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white text-xl font-semibold">Canvas Settings</h2>
              <p className="text-white/60 text-sm">Customize your drawing experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {[
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'export', label: 'Export & Import', icon: Download },
            { id: 'advanced', label: 'Advanced', icon: Layers }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 transition-all ${
                activeTab === id
                  ? 'bg-cyan-500/20 text-cyan-300 border-b-2 border-cyan-500'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              
              {/* Background Color */}
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  Canvas Background
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  {backgroundColors.map((color) => (
                    <div key={color.value} className="text-center">
                      {color.value === 'custom' ? (
                        <div className="relative">
                          <input
                            type="color"
                            value={canvasBackgroundColor}
                            onChange={(e) => onBackgroundColorChange(e.target.value)}
                            className="w-12 h-12 rounded-lg border-2 border-white/20 cursor-pointer bg-transparent"
                          />
                          <div className="text-white/60 text-xs mt-1">Custom</div>
                        </div>
                      ) : (
                        <button
                          onClick={() => onBackgroundColorChange(color.value)}
                          className={`w-12 h-12 rounded-lg border-2 transition-all ${
                            canvasBackgroundColor === color.value
                              ? 'border-cyan-400 scale-110'
                              : 'border-white/20 hover:border-white/40'
                          }`}
                          style={{ backgroundColor: color.value }}
                        />
                      )}
                      <div className="text-white/60 text-xs mt-1">{color.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid Settings */}
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4 text-purple-400" />
                  Grid Options
                </h3>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <div>
                    <div className="text-white font-medium">Show Grid</div>
                    <div className="text-white/60 text-sm">Display grid dots for better alignment</div>
                  </div>
                  <button
                    onClick={onToggleGrid}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showGrid ? 'bg-cyan-500' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showGrid ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              
              {/* Export Options */}
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  Export Canvas
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { format: 'png', label: 'PNG', icon: FileImage, desc: 'High quality' },
                    { format: 'jpg', label: 'JPG', icon: Camera, desc: 'Smaller size' },
                    { format: 'svg', label: 'SVG', icon: Maximize, desc: 'Vector format' }
                  ].map(({ format, label, icon: Icon, desc }) => (
                    <button
                      key={format}
                      onClick={() => exportCanvas(format as any)}
                      className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                    >
                      <Icon className="w-6 h-6 text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-white font-medium">{label}</div>
                      <div className="text-white/60 text-xs">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Share className="w-4 h-4 text-blue-400" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={copyCanvasToClipboard}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <Save className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-white font-medium text-left">Copy to Clipboard</div>
                      <div className="text-white/60 text-xs text-left">Copy as image</div>
                    </div>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <Upload className="w-5 h-5 text-orange-400" />
                    <div>
                      <div className="text-white font-medium text-left">Import Image</div>
                      <div className="text-white/60 text-xs text-left">Add to canvas</div>
                    </div>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={importImage}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              
              {/* Canvas Actions */}
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-yellow-400" />
                  Canvas Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={onReset}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all text-red-400 hover:text-red-300"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Reset Canvas</div>
                      <div className="text-xs opacity-80">Clear all drawings and reset view</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Performance Info */}
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-green-400" />
                  Canvas Info
                </h3>
                <div className="space-y-2 p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Canvas Size:</span>
                    <span className="text-white font-mono">
                      {canvasRef?.current?.width || 0} × {canvasRef?.current?.height || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Background:</span>
                    <span className="text-white font-mono">{canvasBackgroundColor.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Device Pixel Ratio:</span>
                    <span className="text-white font-mono">{window.devicePixelRatio || 1}x</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanvasSettings; 