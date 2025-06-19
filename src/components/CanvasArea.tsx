/* eslint-disable @typescript-eslint/no-explicit-any */
// app/components/CanvasArea.tsx
"use client";
import React, { useRef, useState, useEffect } from "react";
import {
  ViewPort,
  Point,
  CanvasDimensions,
  Tool
} from "../lib/types";

interface CanvasAreaProps {
  viewport: ViewPort;
  setViewport: React.Dispatch<React.SetStateAction<ViewPort>>; // Corrected type!
  tool: Tool;
  isEraserEnabled: boolean;
  drawingHistory: ImageData | null;
  setDrawingHistory: (history: ImageData | null) => void;
  saveToHistory: (imageData: string) => void;
  updateMinimap: (preserveDrawings?: boolean) => void;
  // resetCanvasFn: () => void; // More descriptive name
  canvasDimensions: CanvasDimensions;
  setTool: (tool: Tool) => void;
  setIsPanning: React.Dispatch<React.SetStateAction<boolean>>;
  setLastPanPoint: React.Dispatch<React.SetStateAction<Point | null>>;
  isPanning: boolean;
  lastPanPoint: Point | null;
    selectedColor:string
}

const CanvasArea: React.FC<CanvasAreaProps> = ({
  viewport,
  setViewport,
  tool,
  isEraserEnabled,
  drawingHistory,
  setDrawingHistory,
  saveToHistory,
  updateMinimap,
  canvasDimensions,
  setIsPanning,
  setLastPanPoint,
  isPanning,
  lastPanPoint,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);


  useEffect(() => {
    const initializeCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;

          ctx.fillStyle = "black";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          drawGrid(ctx);
        }
      }
    };

    const updateCanvas = (preserveDrawings = false) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Store the current drawings if needed
      let currentDrawings;
      if (preserveDrawings && drawingHistory) {
        currentDrawings = drawingHistory;
      }

      // Clear canvas
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Apply viewport transform
      ctx.save();
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.zoom, viewport.zoom);

      // Draw grid
      const gridSize = 20;
      const viewportWidth = canvas.width / viewport.zoom;
      const viewportHeight = canvas.height / viewport.zoom;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1 / viewport.zoom;

      // Calculate grid boundaries
      const startX = Math.floor(-viewport.x / viewport.zoom / gridSize) * gridSize;
      const startY = Math.floor(-viewport.y / viewport.zoom / gridSize) * gridSize;
      const endX = startX + viewportWidth + gridSize;
      const endY = startY + viewportHeight + gridSize;

      // Draw vertical lines
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }

      // Draw horizontal lines
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }

      // Restore drawings if needed
      if (preserveDrawings && currentDrawings) {
        ctx.putImageData(currentDrawings, 0, 0);
      }

      ctx.restore();

      // Update minimap
      updateMinimap(preserveDrawings);
    };
    
    initializeCanvas();
    
    requestAnimationFrame(() => {
      updateCanvas(true);
    });
  }, [viewport, drawingHistory, updateMinimap]);

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const { x, y, zoom } = viewport;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const dotSpacing = 20 * zoom;
    const offsetX = x % dotSpacing;
    const offsetY = y % dotSpacing;

    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";

    for (let i = offsetX; i < ctx.canvas.width; i += dotSpacing) {
      for (let j = offsetY; j < ctx.canvas.height; j += dotSpacing) {
        ctx.beginPath();
        ctx.arc(i, j, 1 * zoom, 0, Math.PI * 2);
        ctx.fill();
      }
    }
     updateMinimap();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'hand' || e.buttons === 2 || (e.buttons === 1 && e.altKey)) {
      startPanning(e);
    } else if (tool === 'draw' && e.buttons === 1) {
      startDrawing(e);
    } else if (tool === 'eraser' && e.buttons === 1) {
      startDrawing(e);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      handlePanning(e);
    } else if (isDrawing) {
      draw(e);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      stopPanning();
    }
    if (isDrawing) {
      stopDrawing();
    }
  };

  const startPanning = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPanning(true);
    setLastPanPoint({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  };

  const handlePanning = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning && lastPanPoint) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;

      setViewport((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));

      setLastPanPoint({ x: e.clientX, y: e.clientY });

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          drawGrid(ctx);
        }
      }
    }
  };

  const stopPanning = () => {
    setIsPanning(false);
    setLastPanPoint(null);
    stopDrawing();
  };
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const pressure = (e as any).pressure || 1;
        ctx.strokeStyle =  "white" ; //isEraserEnabled ? "black" : selectedColor; // Fixed color for now to simplify, adjust as needed.
        ctx.lineWidth = ((isEraserEnabled ? 20 : 5) * viewport.zoom) * pressure;
        ctx.beginPath();
        const point = transformPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.moveTo(point.x, point.y);
        setIsDrawing(true);
      }
    }
  };

  const transformPoint = (x: number, y: number): Point => {
    return {
      x: (x - viewport.x) / viewport.zoom,
      y: (y - viewport.y) / viewport.zoom
    };
  };
  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Save the current drawing state
          setDrawingHistory(ctx.getImageData(0, 0, canvas.width, canvas.height));
          const imageData = canvas.toDataURL();
          saveToHistory(imageData);
        }
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply viewport transform for drawing
    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    const point = transformPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    ctx.restore();

    // Update minimap with new drawing
    updateMinimap(true);
  };

  const getCursor = () => {
    switch (tool) {
      case 'hand':
        return isPanning ? 'grabbing' : 'grab';
      case 'eraser':
        return "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"white\" stroke=\"white\" stroke-width=\"2\"><path d=\"M19 19H5L17 7l2 2z\"/></svg>') 0 24, auto";
      default:
        return 'default';
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseOut={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{ cursor: getCursor() }}
        onWheel={() => {}} // handled in Dashboard for now
      />
      <div
          className="absolute border-2 border-blue-500/50 bottom-4 left-4 w-48 h-48 bg-black/50 border border-white/20 rounded-lg overflow-hidden"
          style={{
            pointerEvents: 'none', // Make sure minimap doesn't block events
            opacity: 0.7 // Match original opacity
          }}
        >
           <canvas
              ref={minimapRef}
              className="w-full h-full"
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
    </>
  );
};

export default CanvasArea;
