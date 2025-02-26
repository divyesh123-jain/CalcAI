/* eslint-disable @typescript-eslint/no-explicit-any */
// components/Canvas.tsx
"use client";
import React, {useState } from "react";

interface Point {
  x: number;
  y: number;
}

interface ViewPort {
  x: number;
  y: number;
  zoom: number;
}

interface CanvasDimensions {
  width: number;
  height: number;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;

interface CanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  minimapRef: React.RefObject<HTMLCanvasElement>;
  gridCanvasRef: React.RefObject<HTMLCanvasElement>;
  drawingCanvasRef: React.RefObject<HTMLCanvasElement>;
  tempCanvasRef: React.RefObject<HTMLCanvasElement>;
  canvasDimensions: CanvasDimensions;
  isDrawing: boolean;
  selectedColor: string;
  reset: boolean;
  result: any;
  variable: any;
  isLoading: boolean;
  error: string | null;
  latexPosition: Point;
  latexExpression: string[];
  isErasing: boolean;
  draggingLatex: string | null;
  isEraserEnabled: boolean;
  history: string[];
  currentStep: number;
  viewport: ViewPort;
  lastPanPoint: Point | null;
  isPanning: boolean;
  isHandTool: boolean;
  isSpacePressed: boolean;
  tool: 'draw' | 'hand' | 'eraser';
  drawingHistory: ImageData | null;
  previousToolRef: React.RefObject<'draw' | 'hand' | 'eraser'>;
  centerPoint: Point;
  gridSize: number;
  showMinimap: boolean;
  handleKeyDown: (e: React.KeyboardEvent<HTMLCanvasElement>) => void;
  handleKeyUp: (e: React.KeyboardEvent<HTMLCanvasElement>) => void;
  handleWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
  handleResize: () => void;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: () => void;
  handleMouseOut: () => void;
  handleContextMenu: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  getCursor: () => string;
  updateCanvas: (preserveDrawings?: boolean) => void;
  drawGrid: (ctx: CanvasRenderingContext2D) => void;
  startDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  draw: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  stopDrawing: () => void;
  transformPoint: (x: number, y: number) => Point;
  startPanning: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handlePanning: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  stopPanning: () => void;
  zoomToPoint: (newZoom: number, x: number, y: number) => void;
  panBy: (dx: number, dy: number) => void;
  resetZoom: () => void;
  toggleHandTool: () => void;
  initializeCanvas: () => void;
  saveToHistory: (imageData: string) => void;
  undo: () => void;
  redo: () => void;
  restoreCanvasState: (imageData: string) => void;
  updateMinimap: (preserveDrawings?: boolean) => void;
  setViewport: React.Dispatch<React.SetStateAction<ViewPort>>;
  setIsPanning: React.Dispatch<React.SetStateAction<boolean>>;
  setLastPanPoint: React.Dispatch<React.SetStateAction<Point | null>>;
  setDrawingHistory: React.Dispatch<React.SetStateAction<ImageData | null>>;
  setViewportZoom: (zoom: number) => void;
  setViewportPosition: (x: number, y: number) => void;
  setSelectedColor: React.Dispatch<React.SetStateAction<string>>;
  setIsEraserEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setTool: React.Dispatch<React.SetStateAction<"draw" | "hand" | "eraser">>;
}


const Canvas: React.FC<CanvasProps> = ({
  canvasRef,
  isDrawing,
  selectedColor,
  isEraserEnabled,
  viewport,
  tool,
  handleWheel,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleMouseOut,
  handleContextMenu,
  getCursor,
  stopDrawing,
  transformPoint,
  zoomToPoint,
  panBy,
  updateMinimap,
}) => {

    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (tool === 'hand' || e.touches.length === 2) { // Two fingers for panning/zooming
          startTouchPanning(e);
        } else if (tool === 'draw' && e.touches.length === 1) { // Single finger for drawing
          startTouchDrawing(e);
        } else if (tool === 'eraser' && e.touches.length === 1) { // Single finger for erasing
          startTouchDrawing(e); // Reuse drawing start logic for eraser
        }
        if (e.touches.length === 2) {
          startPinchZoom(e);
        }
      };
    
      const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (isTouchPanning) {
          handleTouchPanning(e);
        } else if (isDrawing) {
          touchDraw(e);
        } else if (isPinchZooming) {
          handlePinchZoom(e);
        }
      };
    
      const handleTouchEnd = () => {
        if (isTouchPanning) {
          stopTouchPanning();
        }
        if (isDrawing) {
          stopDrawing();
        }
        if (isPinchZooming) {
          stopPinchZoom();
        }
      };
    
      const handleTouchCancel = () => {
        if (isTouchPanning) {
          stopTouchPanning();
        }
        if (isDrawing) {
          stopDrawing();
        }
        if (isPinchZooming) {
          stopPinchZoom();
        }
      };

      const [isTouchPanning, setIsTouchPanning] = useState(false);
      const [touchLastPanPoint, setTouchLastPanPoint] = useState<Point | null>(null);
    
      const startTouchPanning = (e: React.TouchEvent<HTMLCanvasElement>) => {
        setIsTouchPanning(true);
        setTouchLastPanPoint(getTouchPoint(canvasRef.current, e));
      };
    
      const handleTouchPanning = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (!isTouchPanning || !touchLastPanPoint) return;
    
        const currentPoint = getTouchPoint(canvasRef.current, e);
        if (!currentPoint) return;
    
        const dx = currentPoint.x - touchLastPanPoint.x;
        const dy = currentPoint.y - touchLastPanPoint.y;
    
        panBy(dx, dy); // Use existing panBy function
    
        setTouchLastPanPoint(currentPoint);
      };
    
      const stopTouchPanning = () => {
        setIsTouchPanning(false);
        setTouchLastPanPoint(null);
      };
    
    
      // Touch Drawing Logic (reusing much of mouse drawing logic)
      const startTouchDrawing = (e: React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.strokeStyle = isEraserEnabled ? "black" : selectedColor;
            ctx.lineWidth = (isEraserEnabled ? 20 : 5) * viewport.zoom;
            ctx.beginPath();
            const point = getTouchPoint(canvas, e);
            if (point) {
              ctx.moveTo(point.x, point.y);
              setIsDrawing(true);
            }
          }
        }
      };
    
    
      const touchDraw = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
    
        const canvas = canvasRef.current;
        if (!canvas) return;
    
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
    
        ctx.save();
        ctx.translate(viewport.x, viewport.y);
        ctx.scale(viewport.zoom, viewport.zoom);
    
        const point = getTouchPoint(canvas, e);
        if (point) {
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
        }
        ctx.restore();
        updateMinimap(true);
      };
    
    
      const getTouchPoint = (canvas: HTMLCanvasElement | null, e: React.TouchEvent<HTMLCanvasElement>): Point | null => {
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        if (!touch) return null;
        return transformPoint(touch.clientX - rect.left, touch.clientY - rect.top);
      };
    
    
      // Pinch to Zoom Logic
      const [isPinchZooming, setIsPinchZooming] = useState(false);
      const [touchZoomCenter, setTouchZoomCenter] = useState<Point | null>(null);
      const [touchInitialDistance, setTouchInitialDistance] = useState<number>(0);
    
      const startPinchZoom = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (e.touches.length !== 2) return;
    
        setIsPinchZooming(true);
    
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
    
        const initialDistance = getDistance(touch1 as Touch, touch2 as Touch);
        setTouchInitialDistance(initialDistance);
    
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const centerPointX = ((touch1.clientX - rect.left) + (touch2.clientX - rect.left)) / 2;
        const centerPointY = ((touch1.clientY - rect.top) + (touch2.clientY - rect.top)) / 2;
        setTouchZoomCenter(transformPoint(centerPointX, centerPointY));
    
      };
    
      const handlePinchZoom = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (!isPinchZooming || e.touches.length !== 2) return;
    
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
    
        const currentDistance = getDistance(touch1 as Touch, touch2 as Touch);
    
        if (touchInitialDistance === 0) {
          setTouchInitialDistance(currentDistance);
          return;
        }
    
        const zoomFactor = currentDistance / touchInitialDistance;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewport.zoom * zoomFactor));
    
    
        if (touchZoomCenter) {
          zoomToPoint(newZoom, touchZoomCenter.x, touchZoomCenter.y);
        }
        setTouchInitialDistance(currentDistance); // Update for next move
      };
    
      const stopPinchZoom = () => {
        setIsPinchZooming(false);
        setTouchInitialDistance(0);
        setTouchZoomCenter(null);
      };
    
    
      const getDistance = (touch1: Touch, touch2: Touch): number => {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
      };
    
    


  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseOut={handleMouseOut}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
      style={{ cursor: getCursor() }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    />
  );
};

export default Canvas;