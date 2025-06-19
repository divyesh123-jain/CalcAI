"use client";
import React, { useRef, useEffect } from 'react';
import { DrawingElement, Point, BrushType } from '../lib/types';

interface DrawingCanvasProps {
  drawingElements: DrawingElement[];
  currentStroke: Point[];
  isDrawing: boolean;
  selectedColor: string;
  brushType: BrushType;
  viewportZoom: number;
  viewportX: number;
  viewportY: number;
  canvasDimensions: { width: number; height: number };
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  drawingElements,
  currentStroke,
  isDrawing,
  selectedColor,
  brushType,
  viewportZoom,
  viewportX,
  viewportY,
  canvasDimensions
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvasDimensions.width;
    canvas.height = canvasDimensions.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Apply viewport transformation
    ctx.translate(viewportX, viewportY);
    ctx.scale(viewportZoom, viewportZoom);

    // Render each drawing element
    drawingElements.forEach(element => {
      if (element.points.length < 2) return;

      ctx.save();

      // Set drawing properties
      ctx.strokeStyle = element.color;
      ctx.lineWidth = element.lineWidth;
      ctx.globalAlpha = element.opacity;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Set blend mode based on brush type
      if (element.brushType === 'highlighter') {
        ctx.globalCompositeOperation = 'multiply';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      // Draw the stroke
      ctx.beginPath();
      ctx.moveTo(element.points[0].x, element.points[0].y);

      for (let i = 1; i < element.points.length; i++) {
        const point = element.points[i];
        ctx.lineTo(point.x, point.y);
      }

      ctx.stroke();
      ctx.restore();
    });

    // Render current stroke being drawn
    if (isDrawing && currentStroke.length >= 2) {
      ctx.save();

      // Set properties for current stroke
      ctx.strokeStyle = selectedColor;
      const lineWidth = brushType === 'pencil' ? 2 : brushType === 'marker' ? 6 : 12;
      const opacity = brushType === 'highlighter' ? 0.3 : 1;
      
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = opacity;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (brushType === 'highlighter') {
        ctx.globalCompositeOperation = 'multiply';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      // Draw the current stroke
      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);

      for (let i = 1; i < currentStroke.length; i++) {
        const point = currentStroke[i];
        ctx.lineTo(point.x, point.y);
      }

      ctx.stroke();
      ctx.restore();
    }

    // Restore context state
    ctx.restore();
  }, [drawingElements, currentStroke, isDrawing, selectedColor, brushType, viewportZoom, viewportX, viewportY, canvasDimensions]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-5"
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  );
}; 