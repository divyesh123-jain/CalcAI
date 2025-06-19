"use client";
import React, { useEffect } from "react";

interface ViewPort {
  x: number;
  y: number;
  zoom: number;
}

interface CanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: () => void;
  handleMouseOut: () => void;
  handleWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
  handleContextMenu: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  getCursor: () => string;
  viewport: ViewPort;
}

const Canvas: React.FC<CanvasProps> = ({
  canvasRef,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleMouseOut,
  handleWheel,
  handleContextMenu,
  getCursor,
  viewport,
}) => {
  // Ensure canvas gets focus immediately when mounted/remounted
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.focus();
    }
  }, [canvasRef]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* SINGLE MAIN CANVAS - All drawing happens here */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseOut={handleMouseOut}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        tabIndex={0}  // Make canvas focusable
        autoFocus     // Auto-focus the canvas
        style={{ 
          cursor: getCursor(),
          touchAction: 'none', // Prevent default touch behaviors
          outline: 'none'      // Remove focus outline
        }}
      />

      {/* Zoom level indicator */}
      <div className="fixed top-6 right-6 px-3 py-2 rounded-lg backdrop-blur-md bg-black/20 border border-white/10 text-white/80 text-sm font-mono z-30">
        {Math.round(viewport.zoom * 100)}%
      </div>
    </div>
  );
};

export default Canvas;
