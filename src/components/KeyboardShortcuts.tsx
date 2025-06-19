// components/KeyboardShortcuts.tsx
"use client";
import React, { useState } from "react";
import { HelpCircle, X, Sparkles } from "lucide-react";

const KeyboardShortcuts = () => {
  const [isOpen, setIsOpen] = useState(false);

  const basicShortcuts = [
    { key: "D", description: "Draw Tool" },
    { key: "S", description: "Select Tool" },
    { key: "H", description: "Hand/Pan Tool" },
    { key: "T", description: "Text Tool" },
    { key: "E", description: "Eraser Tool" },
    { key: "1, 2, 3", description: "Brush Types" },
    { key: "Ctrl+Z", description: "Undo" },
    { key: "Ctrl+Y", description: "Redo" },
    { key: "Ctrl+R", description: "Reset Canvas" },
    { key: "+/-", description: "Zoom In/Out" },
    { key: "Ctrl+0", description: "Center Canvas" },
    { key: "Space", description: "Temporary Hand Tool" },
  ];

  const selectModeShortcuts = [
    { key: "Ctrl+A", description: "Select All Drawings" },
    { key: "M", description: "Toggle Move Mode" },
    { key: "Escape", description: "Deselect All / Exit Modes" },
    { key: "Double-click", description: "Enter Move Mode" },
  ];

  const magicShortcuts = [
    { key: "Ctrl+D", description: "🎨 Duplicate Selected" },
    { key: "Ctrl+H", description: "🔄 Flip Horizontal" },
    { key: "Ctrl+V", description: "🔄 Flip Vertical" },
    { key: "Ctrl++ / Ctrl+-", description: "🔍 Scale Up/Down" },
    { key: "Ctrl+Shift+O", description: "✨ Magic Organize All" },
    { key: "Ctrl+G", description: "📦 Auto Group Nearby" },
    { key: "Ctrl+Shift+S", description: "🎭 Smooth All Strokes" },
    { key: "Right-click", description: "🎉 Magic Context Menu" },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 backdrop-blur-sm border border-white/20"
        title="Keyboard Shortcuts"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black/90 border border-white/20 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 grid md:grid-cols-3 gap-6">
          {/* Basic Shortcuts */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              Basic Controls
            </h3>
            <div className="space-y-2">
              {basicShortcuts.map((shortcut, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <kbd className="px-2 py-1 bg-white/10 rounded text-cyan-300">{shortcut.key}</kbd>
                  <span className="text-white/80 ml-3">{shortcut.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Select Mode Shortcuts */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Select Mode
            </h3>
            <div className="space-y-2">
              {selectModeShortcuts.map((shortcut, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <kbd className="px-2 py-1 bg-white/10 rounded text-green-300">{shortcut.key}</kbd>
                  <span className="text-white/80 ml-3">{shortcut.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Magic Features */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Magic Features
            </h3>
            <div className="space-y-2">
              {magicShortcuts.map((shortcut, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <kbd className="px-2 py-1 bg-white/10 rounded text-purple-300">{shortcut.key}</kbd>
                  <span className="text-white/80 ml-3">{shortcut.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-purple-300">✨ Surprise Features!</span>
            </div>
            <p className="text-white/80 text-sm">
              🎨 <strong>Auto-Smoothing:</strong> All your strokes are automatically smoothed for perfect lines!<br/>
              🎭 <strong>Right-click magic:</strong> Right-click on drawings for a magical context menu with instant effects!<br/>
              ⚡ <strong>Smart organization:</strong> Magic organize arranges all drawings in a perfect grid!<br/>
              🎪 <strong>Auto-grouping:</strong> Automatically groups nearby drawings together for easy management!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;