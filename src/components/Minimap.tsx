// components/Minimap.tsx
"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, X, Home, Eye } from "lucide-react";
import { ViewPort } from "../lib/types";
import { Button } from "@/components/ui/button";

interface CanvasDimensions {
  width: number;
  height: number;
}

interface MinimapProps {
  mainCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  viewport: ViewPort;
  onViewportChange: (viewport: ViewPort) => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
  canvasDimensions: CanvasDimensions;
}

const Minimap: React.FC<MinimapProps> = ({
  mainCanvasRef,
  viewport,
  onViewportChange,
  isVisible,
  onToggleVisibility,
  canvasDimensions,
}) => {
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const minimapSize = isExpanded ? 192 : 128;
  const scale = minimapSize / Math.max(canvasDimensions.width, canvasDimensions.height);

  const drawViewportIndicator = useCallback((ctx: CanvasRenderingContext2D) => {
    const scaleX = minimapSize / canvasDimensions.width;
    const scaleY = minimapSize / canvasDimensions.height;
    const finalScale = Math.min(scaleX, scaleY);
    
    const offsetX = (minimapSize - canvasDimensions.width * finalScale) / 2;
    const offsetY = (minimapSize - canvasDimensions.height * finalScale) / 2;

    // Calculate viewport rectangle with proper scaling
    const viewportX = offsetX + ((-viewport.x / viewport.zoom) * finalScale);
    const viewportY = offsetY + ((-viewport.y / viewport.zoom) * finalScale);
    const viewportWidth = (window.innerWidth / viewport.zoom) * finalScale;
    const viewportHeight = (window.innerHeight / viewport.zoom) * finalScale;

    // Clamp viewport to minimap bounds
    const clampedX = Math.max(0, Math.min(minimapSize - viewportWidth, viewportX));
    const clampedY = Math.max(0, Math.min(minimapSize - viewportHeight, viewportY));
    const clampedWidth = Math.min(viewportWidth, minimapSize - clampedX);
    const clampedHeight = Math.min(viewportHeight, minimapSize - clampedY);

    // Viewport rectangle background with better visibility
    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.fillRect(clampedX, clampedY, clampedWidth, clampedHeight);

    // Viewport rectangle border with gradient
    const borderGradient = ctx.createLinearGradient(clampedX, clampedY, clampedX + clampedWidth, clampedY + clampedHeight);
    borderGradient.addColorStop(0, '#06b6d4');
    borderGradient.addColorStop(1, '#8b5cf6');
    
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.strokeRect(clampedX, clampedY, clampedWidth, clampedHeight);

    // Corner indicators for better visibility
    const cornerSize = 8;
    ctx.fillStyle = '#06b6d4';
    const corners = [
      [clampedX - cornerSize/2, clampedY - cornerSize/2],
      [clampedX + clampedWidth - cornerSize/2, clampedY - cornerSize/2],
      [clampedX - cornerSize/2, clampedY + clampedHeight - cornerSize/2],
      [clampedX + clampedWidth - cornerSize/2, clampedY + clampedHeight - cornerSize/2]
    ];
    
    corners.forEach(([x, y]) => {
      ctx.fillRect(x, y, cornerSize, cornerSize);
    });

    // Center crosshair
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    const centerX = clampedX + clampedWidth / 2;
    const centerY = clampedY + clampedHeight / 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 10, centerY);
    ctx.lineTo(centerX + 10, centerY);
    ctx.moveTo(centerX, centerY - 10);
    ctx.lineTo(centerX, centerY + 10);
    ctx.stroke();
  }, [viewport, canvasDimensions, minimapSize]);

  const drawGridOverlay = useCallback((ctx: CanvasRenderingContext2D) => {
    const gridSpacing = 25 * scale; // Increased spacing for performance
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)'; // Reduced opacity for less visual noise
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);

    // Simplified grid drawing - only draw every other line
    for (let x = 0; x <= minimapSize; x += gridSpacing * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, minimapSize);
      ctx.stroke();
    }

    for (let y = 0; y <= minimapSize; y += gridSpacing * 2) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(minimapSize, y);
      ctx.stroke();
    }
  }, [scale, minimapSize]);

  const updateMinimap = useCallback(() => {
    const minimapCanvas = minimapCanvasRef.current;
    const mainCanvas = mainCanvasRef.current;

    if (!minimapCanvas || !mainCanvas || !isVisible) return;

    const ctx = minimapCanvas.getContext('2d');
    if (!ctx) return;

    // Throttle updates for performance
    const now = Date.now();
    if (now - lastUpdate < 100) return; // Minimum 100ms between updates

    // Set canvas size with high DPI support (optimized)
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
    minimapCanvas.width = minimapSize * devicePixelRatio;
    minimapCanvas.height = minimapSize * devicePixelRatio;
    minimapCanvas.style.width = `${minimapSize}px`;
    minimapCanvas.style.height = `${minimapSize}px`;
    
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, minimapSize, minimapSize);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, minimapSize, minimapSize);

    // Draw main canvas content (scaled down) with better quality
    try {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium'; // Changed from 'high' to 'medium' for performance
      
      const scaleX = minimapSize / mainCanvas.width;
      const scaleY = minimapSize / mainCanvas.height;
      const finalScale = Math.min(scaleX, scaleY);
      
      const offsetX = (minimapSize - mainCanvas.width * finalScale) / 2;
      const offsetY = (minimapSize - mainCanvas.height * finalScale) / 2;
      
      ctx.translate(offsetX, offsetY);
      ctx.scale(finalScale, finalScale);
      ctx.drawImage(mainCanvas, 0, 0);
      ctx.restore();
    } catch (error) {
      console.warn('Failed to draw main canvas to minimap:', error);
    }

    // Draw viewport indicator with enhanced accuracy
    drawViewportIndicator(ctx);

    // Simplified grid overlay for performance
    if (minimapSize > 150) { // Only show grid on larger minimap
      drawGridOverlay(ctx);
    }
    
    setLastUpdate(now);
  }, [viewport, canvasDimensions, isVisible, minimapSize, mainCanvasRef, lastUpdate, drawViewportIndicator, drawGridOverlay]);

  useEffect(() => {
    updateMinimap();
    
    // Reduce update frequency for better performance
    const interval = setInterval(updateMinimap, 300); // Changed from 100ms to 300ms
    return () => clearInterval(interval);
  }, [updateMinimap]);

  const handleViewportMove = useCallback((e: React.MouseEvent) => {
    const rect = minimapCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = minimapSize / canvasDimensions.width;
    const scaleY = minimapSize / canvasDimensions.height;
    const finalScale = Math.min(scaleX, scaleY);
    
    const offsetX = (minimapSize - canvasDimensions.width * finalScale) / 2;
    const offsetY = (minimapSize - canvasDimensions.height * finalScale) / 2;

    // Convert minimap coordinates to canvas coordinates with proper scaling
    const canvasX = ((x - offsetX) / finalScale) * viewport.zoom - window.innerWidth / 2;
    const canvasY = ((y - offsetY) / finalScale) * viewport.zoom - window.innerHeight / 2;

    onViewportChange({
      ...viewport,
      x: -canvasX,
      y: -canvasY,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport, onViewportChange, canvasDimensions, minimapSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    handleViewportMove(e);
    e.preventDefault();
  }, [handleViewportMove]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    handleViewportMove(e);
    e.preventDefault();
  }, [isDragging, handleViewportMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (!isVisible) {
    return (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
        <button
          onClick={onToggleVisibility}
          className="px-4 py-2 rounded-lg backdrop-blur-md bg-black/20 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Show Minimap
        </button>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-5 right-5 z-40 rounded-xl bg-black/30 backdrop-blur-lg border border-white/10 shadow-2xl transition-all duration-300 ${isExpanded ? 'w-48 h-48' : 'w-32 h-32'}`}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute top-1 right-1 z-10 flex space-x-1">
        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
        </Button>
        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={onToggleVisibility}>
          <X className="w-3 h-3" />
        </Button>
      </div>

      <canvas
        ref={minimapCanvasRef}
        className="w-full h-full rounded-xl cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      
      <div className="absolute bottom-1 left-1 z-10 flex space-x-1">
        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => onViewportChange({ ...viewport, zoom: Math.min(viewport.zoom * 1.2, 10) })}>
          <ZoomIn className="w-3 h-3" />
        </Button>
        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => onViewportChange({ ...viewport, zoom: Math.max(viewport.zoom / 1.2, 0.1) })}>
          <ZoomOut className="w-3 h-3" />
        </Button>
        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => onViewportChange({ x: 0, y: 0, zoom: 1 })}>
          <Home className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default Minimap;