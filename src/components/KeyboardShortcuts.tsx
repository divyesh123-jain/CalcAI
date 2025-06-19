// components/KeyboardShortcuts.tsx
"use client";
import React from "react";

const KeyboardShortcuts = () => {
  return (
    <div className="absolute bottom-4 right-4 text-white/50 text-sm space-y-1">
      <div>
        <kbd className="px-2 py-1 bg-white/10 rounded">Space</kbd> Hand tool
      </div>
      <div>
        <kbd className="px-2 py-1 bg-white/10 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-white/10 rounded">0</kbd> Reset zoom
      </div>
      <div>
        <kbd className="px-2 py-1 bg-white/10 rounded">Home</kbd> Center canvas
      </div>
    </div>
  );
};

export default KeyboardShortcuts;