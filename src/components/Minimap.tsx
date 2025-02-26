// components/Minimap.tsx
"use client";
import React, {  useEffect } from "react";

// interface Point {
//   x: number;
//   y: number;
// }

interface ViewPort {
  x: number;
  y: number;
  zoom: number;
}

interface CanvasDimensions {
  width: number;
  height: number;
}

interface MinimapProps {
  minimapRef: React.RefObject<HTMLCanvasElement>;
  viewport: ViewPort;
  canvasDimensions: CanvasDimensions;
  drawingHistory: ImageData | null;
  showMinimap: boolean;
}

const Minimap: React.FC<MinimapProps> = ({ minimapRef, viewport, canvasDimensions, drawingHistory, showMinimap }) => {

  useEffect(() => {
    if (minimapRef.current) {
      const minimapCtx = minimapRef.current.getContext('2d');
      if (minimapCtx) {
        minimapCtx.fillStyle = 'black';
        minimapCtx.fillRect(0, 0, minimapRef.current.width, minimapRef.current.height);
      }
    }
  }, []);

  useEffect(() => {
    updateMinimap();
  }, [viewport, canvasDimensions, drawingHistory, showMinimap]);


  const updateMinimap = (preserveDrawings = false) => {
    const mainCanvas = document.querySelector('canvas'); // Directly select main canvas as ref is passed to Canvas component
    const minimapCanvas = minimapRef.current;

    if (!mainCanvas || !minimapCanvas) return;

    const minimapCtx = minimapCanvas.getContext('2d');
    const mainCtx = mainCanvas.getContext('2d');

    if (!minimapCtx || !mainCtx) return;

    // Set minimap dimensions
    minimapCanvas.width = 192;
    minimapCanvas.height = 192;

    // Clear minimap
    minimapCtx.fillStyle = 'black';
    minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);

    // Calculate the scale factor for the minimap
    const scaleX = minimapCanvas.width / mainCanvas.width;
    const scaleY = minimapCanvas.height / mainCanvas.height;

    // Draw the scaled content
    minimapCtx.save();
    minimapCtx.scale(scaleX, scaleY);

    // Draw grid and content
    minimapCtx.drawImage(mainCanvas, 0, 0);

    // Draw current drawings if preserving
    if (preserveDrawings && drawingHistory) {
      minimapCtx.putImageData(
        drawingHistory,
        viewport.x * scaleX,
        viewport.y * scaleY
      );
    }

    minimapCtx.restore();

    // Draw viewport rectangle
    const viewportRect = {
      x: (-viewport.x * scaleX) / viewport.zoom,
      y: (-viewport.y * scaleY) / viewport.zoom,
      width: (mainCanvas.width * scaleX) / viewport.zoom,
      height: (mainCanvas.height * scaleY) / viewport.zoom
    };

    minimapCtx.strokeStyle = 'rgba(0, 128, 255, 0.8)';
    minimapCtx.lineWidth = 2;
    minimapCtx.strokeRect(
      viewportRect.x,
      viewportRect.y,
      viewportRect.width,
      viewportRect.height
    );
  };


  if (!showMinimap) return null;

  return (
    <div className="absolute bottom-4 left-4 w-48 h-48 bg-black/50 border border-white/20 rounded-lg overflow-hidden">
      <canvas
        ref={minimapRef}
        className="w-full h-full"
        style={{ opacity: 0.7 }}
      />
      <div
        className="absolute border-2 border-blue-500/50"
        style={{
          left: `${(-viewport.x / (canvasDimensions.width || 1)) * 100}%`,
          top: `${(-viewport.y / (canvasDimensions.height || 1)) * 100}%`,
          width: `${(window.innerWidth / (canvasDimensions.width || 1)) * 100}%`,
          height: `${(window.innerHeight / (canvasDimensions.height || 1)) * 100}%`,
        }}
      />
    </div>
  );
};

export default Minimap;