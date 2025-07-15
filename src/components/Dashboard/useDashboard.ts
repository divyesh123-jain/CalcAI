/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  ViewPort,
  Tool,
  BrushType,
  GeneratedResult,
  Point,
  CanvasDimensions,
  Rect,
  Stroke,
} from "../../lib/types";
import { getStrokeAsPath } from "@/lib/canvas-utils";
import { getStrokesBoundingBox } from "@/lib/canvas-utils";

type DrawingState = "idle" | "drawing" | "panning" | "erasing" | "selecting" | "resizing";
type ResizeHandle = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface UseDashboardReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  worldCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  minimapRef: React.RefObject<HTMLCanvasElement | null>;
  canvasDimensions: CanvasDimensions;
  isDrawing: boolean;
  selectedColor: string;
  reset: boolean;
  result: GeneratedResult | null;
  variable: Record<string, any>;
  isLoading: boolean;
  error: string | null;
  latexPosition: Point;
  latexExpression: Array<string>;
  isErasing: boolean;
  draggingLatex: string | null;
  isEraserEnabled: boolean;
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  viewport: ViewPort;
  lastPanPoint: Point | null;
  isPanning: boolean;
  isPanningSelection: boolean;
  isHandTool: boolean;
  isSpacePressed: boolean;
  tool: Tool;
  brushType: BrushType;
  brushSize: number;
  brushOpacity: number;
  eraserSize: number;
  centerPoint: Point;
  gridSize: number;
  showMinimap: boolean;
  canvasBackgroundColor: string;
  lastPoint: Point | null;
  selection: Rect | null;
  selectionViewport: ViewPort;
  elements: Stroke[];
  selectedElementIds: string[];
  drawingState: DrawingState;
  setSelectedColor: React.Dispatch<React.SetStateAction<string>>;
  setIsEraserEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setViewport: React.Dispatch<React.SetStateAction<ViewPort>>;
  setLastPanPoint: React.Dispatch<React.SetStateAction<Point | null>>;
  setIsPanning: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPanningSelection: React.Dispatch<React.SetStateAction<boolean>>;
  setTool: (tool: Tool) => void;
  setShowMinimap: React.Dispatch<React.SetStateAction<boolean>>;
  setBrushType: React.Dispatch<React.SetStateAction<BrushType>>;
  setBrushSize: React.Dispatch<React.SetStateAction<number>>;
  setBrushOpacity: React.Dispatch<React.SetStateAction<number>>;
  setEraserSize: React.Dispatch<React.SetStateAction<number>>;
  setCanvasBackgroundColor: React.Dispatch<React.SetStateAction<string>>;
  setSelection: React.Dispatch<React.SetStateAction<Rect | null>>;
  setSelectionViewport: React.Dispatch<React.SetStateAction<ViewPort>>;
  handleKeyDown: (e: KeyboardEvent) => void;
  handleKeyUp: (e: KeyboardEvent) => void;
  handleResize: () => void;
  initializeCanvas: () => void;
  drawGrid: (ctx: CanvasRenderingContext2D) => void;
  saveCanvasState: () => void;
  undo: () => void;
  redo: () => void;
  restoreElements: (elements: Stroke[]) => void;
  resetCanvas: () => void;
  sendData: (texts?: Array<{id: string, text: string, x: number, y: number, rotation: number}>, textStyle?: {fontFamily: string, fontSize: number, color: string, opacity: number, fontWeight: string, fontStyle: string}, selection?: Rect | null) => Promise<void>;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: () => void;
  handleMouseOut: () => void;
  handleTouchStart: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  handleTouchMove: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  handleTouchEnd: () => void;
  handleWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
  handleContextMenu: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleDoubleClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleZoom: (zoomIn: boolean) => void;
  zoomToPoint: (newZoom: number, x: number, y: number) => void;
  panBy: (dx: number, dy: number) => void;
  resetZoom: () => void;
  centerCanvas: () => void;
  toggleHandTool: () => void;
  toggleEraser: () => void;
  getCursor: () => string;
  setElements: React.Dispatch<React.SetStateAction<Stroke[]>>;
  setSelectedElementIds: React.Dispatch<React.SetStateAction<string[]>>;
  zoomToSelection: () => void;
  scaleSelection: (scaleFactor: number) => void;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 5;
const ZOOM_SENSITIVITY = 0.001;
const PAN_SENSITIVITY = 1.2;
const DEFAULT_VIEWPORT: ViewPort = { x: 0, y: 0, zoom: 1 };

export const useDashboard = (): UseDashboardReturn => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapRef = useRef<HTMLCanvasElement | null>(null);
  const previousToolRef = useRef<Tool>('draw');

  // Canvas state
  const [canvasDimensions, setCanvasDimensions] = useState<CanvasDimensions>({
    width: typeof window !== "undefined" ? window.innerWidth : 800,
    height: typeof window !== "undefined" ? window.innerHeight : 600
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState("tomato");
  const [reset, setReset] = useState(false);
  const [brushType, setBrushType] = useState<BrushType>('pencil');
  const [brushSize, setBrushSize] = useState(5);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [eraserSize, setEraserSize] = useState(20);
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState("#000000");
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [elements, setElements] = useState<Stroke[]>([]);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [drawingState, setDrawingState] = useState<DrawingState>('idle');
  const [resizeStart, setResizeStart] = useState<{ handle: ResizeHandle, originalBox: Rect, originalStrokes: Stroke[] } | null>(null);

  // Result state
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [variable, setVariable] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Latex expression state
  const [latexExpression, setLatexExpression] = useState<string[]>([]);

  // Tools state
  const [isEraserEnabled, setIsEraserEnabled] = useState(false);
  const [tool, setToolInternal] = useState<Tool>('draw');
  const [isHandTool, setIsHandTool] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // New history implementation for objects
  const [history, setHistory] = useState<Stroke[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Viewport state
  const [viewport, setViewport] = useState<ViewPort>(DEFAULT_VIEWPORT);
  const [lastPanPoint, setLastPanPoint] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isPanningSelection, setIsPanningSelection] = useState(false);
  const [selection, setSelection] = useState<Rect | null>(null);
  const [selectionViewport, setSelectionViewport] = useState<ViewPort>({ x: 0, y: 0, zoom: 1 });

  const [centerPoint] = useState<Point>({ 
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 400, 
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 300 
  });
  const [showMinimap, setShowMinimap] = useState(true);

  // Check if we can undo/redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Setup keyboard and resize handlers
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const handleKeyDownEvent = (e: KeyboardEvent) => {
      handleKeyDown(e);
    };

    const handleKeyUpEvent = (e: KeyboardEvent) => {
      handleKeyUp(e);
    };

    const handleResizeEvent = () => {
      handleResize();
    };

    window.addEventListener('keydown', handleKeyDownEvent);
    window.addEventListener('keyup', handleKeyUpEvent);
    window.addEventListener('resize', handleResizeEvent);

    // Initial canvas setup
    if (canvasRef.current) {
      initializeCanvas();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDownEvent);
      window.removeEventListener('keyup', handleKeyUpEvent);
      window.removeEventListener('resize', handleResizeEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-initialize canvas when canvasRef changes
  useEffect(() => {
    if (canvasRef.current) {
      initializeCanvas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef.current]);

  const redrawView = () => {
    if (typeof window === 'undefined') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.fillStyle = canvasBackgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);
    
    drawTransformedGrid(ctx);
    
    // Draw all elements
    elements.forEach(stroke => {
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.brushSize;
      ctx.globalAlpha = stroke.opacity;
      
      const path = getStrokeAsPath(stroke);
      ctx.stroke(new Path2D(path));
    });

    // Draw selection rectangle
    if (selection) {
      ctx.save();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'; // blue-500
      ctx.lineWidth = 1.5 / viewport.zoom;
      ctx.setLineDash([6, 4]);

      let { x, y, width, height } = selection;
      if (width < 0) {
        x += width;
        width = -width;
      }
      if (height < 0) {
        y += height;
        height = -height;
      }
      ctx.strokeRect(x, y, width, height);
      ctx.restore();
    }

    ctx.restore();
  };

  // Redraw grid and canvas content when viewport or background changes
  useEffect(() => {
    redrawView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport, canvasBackgroundColor, elements, selection]);


  // Handle canvas reset
  useEffect(() => {
    if (reset) {
      resetCanvas();
      setLatexExpression([]);
      setResult(null);
      setVariable({});
      setReset(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset]);

  // CANVAS INITIALIZATION
  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    setCanvasDimensions({
      width: canvas.width,
      height: canvas.height
    });

    // Create world canvas
    if (!worldCanvasRef.current) {
      worldCanvasRef.current = document.createElement('canvas');
    }
    const worldCanvas = worldCanvasRef.current;
    // Define a fixed large size for the world canvas
    worldCanvas.width = 5000;
    worldCanvas.height = 5000;

    const worldCtx = worldCanvas.getContext('2d');
    if (worldCtx) {
      worldCtx.lineCap = "round";
      worldCtx.lineJoin = "round";
      worldCtx.imageSmoothingEnabled = true;
      worldCtx.imageSmoothingQuality = "high";
    }

    // Set drawing properties
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Clear canvas with background
    ctx.fillStyle = canvasBackgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid(ctx);

    // Save initial empty state
    setHistory([[]]);
    setHistoryIndex(0);

    console.log('Canvas initialized:', { width: canvas.width, height: canvas.height });
  };

  // Simple grid
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const gridSpacing = 50;
    const dotSize = 1.5; // Smaller, more subtle dots
    
    ctx.save();
    
    // More subtle grid colors that blend better with background
    if (canvasBackgroundColor === '#000000') {
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; // Much more subtle white dots on black
    } else {
      // For non-black backgrounds, use a color that's slightly different from background
      const r = parseInt(canvasBackgroundColor.slice(1, 3), 16);
      const g = parseInt(canvasBackgroundColor.slice(3, 5), 16);
      const b = parseInt(canvasBackgroundColor.slice(5, 7), 16);
      
      // Create a subtle contrast - if background is light, use darker dots, if dark, use lighter dots
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      if (brightness > 128) {
        // Light background - use darker dots
        ctx.fillStyle = `rgba(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)}, 0.08)`;
      } else {
        // Dark background - use lighter dots
        ctx.fillStyle = `rgba(${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 40)}, 0.08)`;
      }
    }
    
    // Simple static grid
    for (let x = gridSpacing; x < ctx.canvas.width; x += gridSpacing) {
      for (let y = gridSpacing; y < ctx.canvas.height; y += gridSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  };



  // Draw grid with viewport transformation
  const drawTransformedGrid = (ctx: CanvasRenderingContext2D) => {
    // Skip grid at very low zoom levels to avoid performance issues
    if (viewport.zoom < 0.2) return;
    
    const gridSpacing = 50;
    const dotSize = Math.max(0.5, 1.5 / viewport.zoom); // Smaller, more subtle dots
    
    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);
    
    // More subtle grid colors that blend better with background
    if (canvasBackgroundColor === '#000000') {
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; // Much more subtle white dots on black
    } else {
      // For non-black backgrounds, use a color that's slightly different from background
      const r = parseInt(canvasBackgroundColor.slice(1, 3), 16);
      const g = parseInt(canvasBackgroundColor.slice(3, 5), 16);
      const b = parseInt(canvasBackgroundColor.slice(5, 7), 16);
      
      // Create a subtle contrast - if background is light, use darker dots, if dark, use lighter dots
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      if (brightness > 128) {
        // Light background - use darker dots
        ctx.fillStyle = `rgba(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)}, 0.08)`;
      } else {
        // Dark background - use lighter dots
        ctx.fillStyle = `rgba(${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 40)}, 0.08)`;
      }
    }
    
    // Calculate visible area in world coordinates
    const startX = Math.floor(-viewport.x / viewport.zoom / gridSpacing) * gridSpacing;
    const startY = Math.floor(-viewport.y / viewport.zoom / gridSpacing) * gridSpacing;
    const endX = startX + (window.innerWidth / viewport.zoom) + gridSpacing * 2;
    const endY = startY + (window.innerHeight / viewport.zoom) + gridSpacing * 2;
    
    // Limit grid rendering to reasonable bounds
    const maxGridPoints = 10000;
    const gridPointsX = Math.ceil((endX - startX) / gridSpacing);
    const gridPointsY = Math.ceil((endY - startY) / gridSpacing);
    
    if (gridPointsX * gridPointsY > maxGridPoints) {
      ctx.restore();
      return;
    }
    
    // Draw grid dots only in visible area
    for (let x = startX; x <= endX; x += gridSpacing) {
      for (let y = startY; y <= endY; y += gridSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  };

  // Redraw grid when viewport changes without clearing canvas content
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Don't redraw if we're currently drawing
    if (isDrawing) return;

    // Use a throttled approach to avoid excessive redraws during panning
    const timeoutId = setTimeout(() => {
      // Store the current canvas content
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCtx.drawImage(canvas, 0, 0);
      }

      // Clear and redraw background/grid
      ctx.fillStyle = canvasBackgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawTransformedGrid(ctx);
      
      // Restore the canvas content immediately
      if (tempCtx) {
        ctx.drawImage(tempCanvas, 0, 0);
      }
    }, 16); // Throttle to ~60fps

    return () => clearTimeout(timeoutId);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport]);

  // PURE CANVAS DRAWING WITH VIEWPORT SUPPORT
  const startDrawing = (x: number, y: number) => {
    setDrawingState("drawing");
    
    const newStroke: Stroke = {
      id: `stroke_${Date.now()}`,
      points: [{ x, y }],
      color: selectedColor,
      brushSize: brushSize,
      opacity: brushOpacity,
    };
    
    setElements(prev => [...prev, newStroke]);
    setIsDrawing(true);
  };

  const continueDrawing = (x: number, y: number) => {
    if (drawingState !== 'drawing' || elements.length === 0) return;

    setElements(prevElements => {
      const newElements = [...prevElements];
      const lastStroke = newElements[newElements.length - 1];
      lastStroke.points.push({ x, y });
      return newElements;
    });
  };

  const finishDrawing = () => {
    if (drawingState !== 'drawing') return;
    
    setDrawingState("idle");
    setIsDrawing(false);

    // Save canvas state after drawing
    const newHistory = [...history.slice(0, historyIndex + 1), elements];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    console.log('Drawing finished, canvas state saved');
  };

  // UNDO/REDO WITH CANVAS SNAPSHOTS
  const saveCanvasState = () => {
    // Remove any history after current index (for branching)
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(elements);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    console.log('Canvas state saved. Index:', newHistory.length - 1, 'Total:', newHistory.length);
  };

  const undo = () => {
    console.log('Undo - Current index:', historyIndex, 'History length:', history.length);
    
    if (historyIndex <= 0) {
      console.log('Cannot undo - at beginning');
      return;
    }
    
    const newIndex = historyIndex - 1;
    const newElements = history[newIndex];
    
    setHistoryIndex(newIndex);
    restoreElements(newElements);
    
    console.log('Undo to index:', newIndex);
  };

  const redo = () => {
    console.log('Redo - Current index:', historyIndex, 'History length:', history.length);
    
    if (historyIndex >= history.length - 1) {
      console.log('Cannot redo - at end');
      return;
    }
    
    const newIndex = historyIndex + 1;
    const newElements = history[newIndex];
    
    setHistoryIndex(newIndex);
    restoreElements(newElements);
    
    console.log('Redo to index:', newIndex);
  };

  const restoreElements = (elements: Stroke[]) => {
    setElements(elements);
    redrawView();
    console.log('Canvas restored from elements');
  };
  
  // MOUSE HANDLING
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>, handle?: ResizeHandle) => {
    console.log('=== MOUSE DOWN ===');
    console.log('Tool:', tool, 'isEraserEnabled:', isEraserEnabled, 'Button:', e.button);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    console.log('Click position:', { x, y });

    if (tool === 'hand' || e.button === 2 || (e.button === 0 && e.altKey)) {
      console.log('STARTING PANNING');
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    } else if (tool === 'draw') {
      console.log('STARTING DRAWING - Tool is:', tool);
      startDrawing(x, y);
    } else if (tool === 'eraser') {
      setDrawingState('erasing');
    } else if (tool === 'selection') {
      if (!selection) {
        const worldX = (x - viewport.x) / viewport.zoom;
        const worldY = (y - viewport.y) / viewport.zoom;
        setSelection({ x: worldX, y: worldY, width: 0, height: 0 });
      }
    } else if (handle) {
      const selectedStrokes = elements.filter(el => selectedElementIds.includes(el.id));
      const boundingBox = getStrokesBoundingBox(selectedStrokes);
      if (boundingBox) {
        setDrawingState('resizing');
        setResizeStart({ handle, originalBox: boundingBox, originalStrokes: selectedStrokes });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const worldX = (e.clientX - viewport.x) / viewport.zoom;
    const worldY = (e.clientY - viewport.y) / viewport.zoom;

    if (isPanning && lastPanPoint) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      
      // Update viewport immediately
      const newViewport = {
        ...viewport,
        x: viewport.x + dx,
        y: viewport.y + dy
      };
      
      setViewport(newViewport);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      
    } else if (drawingState === 'resizing' && resizeStart) {
      const { handle, originalBox, originalStrokes } = resizeStart;
      
      let scaleX = 1, scaleY = 1, translateX = 0, translateY = 0;

      if (handle.includes('right')) {
        scaleX = (worldX - originalBox.x) / originalBox.width;
      }
      if (handle.includes('left')) {
        scaleX = (originalBox.x + originalBox.width - worldX) / originalBox.width;
        translateX = originalBox.x + originalBox.width;
      }
      if (handle.includes('bottom')) {
        scaleY = (worldY - originalBox.y) / originalBox.height;
      }
      if (handle.includes('top')) {
        scaleY = (originalBox.y + originalBox.height - worldY) / originalBox.height;
        translateY = originalBox.y + originalBox.height;
      }
      
      const updatedElements = elements.map(el => {
        if (!selectedElementIds.includes(el.id)) return el;
        
        const originalStroke = originalStrokes.find(s => s.id === el.id);
        if (!originalStroke) return el;

        return {
          ...el,
          points: originalStroke.points.map(p => ({
            x: (p.x - translateX) * scaleX + translateX,
            y: (p.y - translateY) * scaleY + translateY,
          })),
        };
      });
      setElements(updatedElements);
    } else if (drawingState === 'drawing') {
      continueDrawing(worldX, worldY);
    } else if (drawingState === 'erasing') {
      const eraserRadius = (eraserSize / 2) / viewport.zoom;
      const newElements: Stroke[] = [];
      let somethingChanged = false;
  
      elements.forEach(stroke => {
          let currentSegment: { x: number; y: number }[] = [];
          let pointsErasedInStroke = 0;
          const segments: { x: number; y: number }[][] = [];
  
          for (const point of stroke.points) {
              const distance = Math.hypot(point.x - worldX, point.y - worldY);
              if (distance < eraserRadius) {
                  pointsErasedInStroke++;
                  if (currentSegment.length > 1) {
                      segments.push(currentSegment);
                  }
                  currentSegment = [];
              } else {
                  currentSegment.push(point);
              }
          }
  
          if (currentSegment.length > 1) {
              segments.push(currentSegment);
          }
  
          if (pointsErasedInStroke === 0) {
              newElements.push(stroke);
          } else {
              somethingChanged = true;
              segments.forEach((segment, index) => {
                  newElements.push({
                      ...stroke,
                      id: `${stroke.id}_split_${Date.now()}_${index}`,
                      points: segment,
                  });
              });
          }
      });
  
      if (somethingChanged) {
          setElements(newElements);
      }
    } else if (tool === 'selection' && selection && !isPanningSelection) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const worldX = (x - viewport.x) / viewport.zoom;
      const worldY = (y - viewport.y) / viewport.zoom;
      setSelection({
        ...selection,
        width: worldX - selection.x,
        height: worldY - selection.y,
      });
    }
  };

  const handleMouseUp = () => {
    console.log('=== MOUSE UP ===');
    console.log('Was panning:', isPanning, 'Was drawing:', isDrawing);
    
    if (isPanning) {
      console.log('STOPPING PANNING');
      setIsPanning(false);
      setLastPanPoint(null);
    }

    if (drawingState === 'drawing') {
      finishDrawing();
    }

    if (drawingState === 'erasing') {
      setDrawingState('idle');
      saveCanvasState();
    }
    
    if (drawingState === 'resizing') {
      setDrawingState('idle');
      setResizeStart(null);
      saveCanvasState();
    }
    
    if (tool === 'selection' && selection) {
      // Normalize the rectangle.
      const newSelection = { ...selection };
      if (newSelection.width < 0) {
        newSelection.x = newSelection.x + newSelection.width;
        newSelection.width = -newSelection.width;
      }
      if (newSelection.height < 0) {
        newSelection.y = newSelection.y + newSelection.height;
        newSelection.height = -newSelection.height;
      }

      if (newSelection.width < 5 && newSelection.height < 5) {
        setSelection(null);
      } else {
        setSelection(newSelection);
        const selectedIds = elements.filter(el => {
          const elBbox = getStrokesBoundingBox([el]);
          if (!elBbox) return false;
          // Simple intersection check
          return (
            newSelection.x < elBbox.x + elBbox.width &&
            newSelection.x + newSelection.width > elBbox.x &&
            newSelection.y < elBbox.y + elBbox.height &&
            newSelection.y + newSelection.height > elBbox.y
          );
        }).map(el => el.id);
        setSelectedElementIds(selectedIds);
        setSelection(null); // Clear the drawing rectangle
        setTool('hand'); // Switch to hand tool after selection
      }
    }
  };

  const handleMouseOut = () => {
    handleMouseUp();
  };

  // TOUCH HANDLING
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent default touch behaviors like scrolling
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const touch = e.touches[0];
    if (!touch) return;

    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    console.log('=== TOUCH START ===');
    console.log('Tool:', tool, 'Touch position:', { x, y });

    if (tool === 'hand') {
      console.log('STARTING TOUCH PANNING');
      setIsPanning(true);
      setLastPanPoint({ x: touch.clientX, y: touch.clientY });
    } else if (tool === 'draw' || tool === 'eraser') {
      console.log('STARTING TOUCH DRAWING');
      startDrawing(x, y);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent default touch behaviors like scrolling
    
    const touch = e.touches[0];
    if (!touch) return;

    if (isPanning && lastPanPoint) {
      const dx = touch.clientX - lastPanPoint.x;
      const dy = touch.clientY - lastPanPoint.y;
      
      // Update viewport immediately
      const newViewport = {
        ...viewport,
        x: viewport.x + dx,
        y: viewport.y + dy
      };
      
      setViewport(newViewport);
      setLastPanPoint({ x: touch.clientX, y: touch.clientY });
      
    } else if (drawingState === 'drawing') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      continueDrawing(x, y);
    }
  };

  const handleTouchEnd = () => {
    console.log('=== TOUCH END ===');
    console.log('Was panning:', isPanning, 'Was drawing:', isDrawing);
    
    if (isPanning) {
      console.log('STOPPING TOUCH PANNING');
      setIsPanning(false);
      setLastPanPoint(null);
    }

    if (drawingState === 'drawing') {
      finishDrawing();
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, viewport.zoom * (1 + delta)));
      const mouseX = e.nativeEvent.offsetX;
      const mouseY = e.nativeEvent.offsetY;
      zoomToPoint(newZoom, mouseX, mouseY);
    } else {
      panBy(-e.deltaX * PAN_SENSITIVITY, -e.deltaY * PAN_SENSITIVITY);
    }
  };

  const handleZoom = (zoomIn: boolean) => {
    if (typeof window === "undefined") return;
    
    const currentZoom = viewport.zoom;
    const zoomStep = zoomIn ? 0.2 : -0.2;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + zoomStep));

    // Zoom to center of screen
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    zoomToPoint(newZoom, centerX, centerY);
  };

  const zoomToPoint = (newZoom: number, x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    const rect = canvas.getBoundingClientRect();
    const mouseX = x - rect.left;
    const mouseY = y - rect.top;

    const worldX = (mouseX - viewport.x) / viewport.zoom;
    const worldY = (mouseY - viewport.y) / viewport.zoom;

    const newX = mouseX - worldX * clampedZoom;
    const newY = mouseY - worldY * clampedZoom;

    setViewport({ x: newX, y: newY, zoom: clampedZoom });
  };

  const panBy = (dx: number, dy: number) => {
    setViewport(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy
    }));
  };

  const resetZoom = () => {
    setViewport(DEFAULT_VIEWPORT);
  };

  const centerCanvas = () => {
    if (typeof window === "undefined") return;
    
    setViewport(prev => ({
      ...prev,
      x: centerPoint.x - (window.innerWidth / 2) * prev.zoom,
      y: centerPoint.y - (window.innerHeight / 2) * prev.zoom
    }));
  };

  const setTool = (newTool: Tool) => {
    console.log(`setTool called with: ${newTool}, current tool: ${tool}`);
    setToolInternal(newTool);
    // Update isEraserEnabled based on tool
    setIsEraserEnabled(newTool === 'eraser');
    console.log(`Tool set to: ${newTool}, isEraserEnabled: ${newTool === 'eraser'}`);
  };

    const toggleEraser = () => {
    console.log('TOGGLE ERASER CLICKED - Current tool:', tool);
    if (tool === 'eraser') {
      console.log('Switching to draw tool');
      setTool('draw');
    } else {
      console.log('Switching to eraser tool'); 
      setTool('eraser');
    }
  };

  const toggleHandTool = () => {
    if (tool !== 'hand') {
      previousToolRef.current = tool;
      setTool('hand');
      setIsHandTool(true);
    } else {
      setTool(previousToolRef.current || 'draw');
      setIsHandTool(false);
    }
  };

  const getCursor = () => {
    if (isSpacePressed || tool === 'hand') {
      return isPanning ? 'grabbing' : 'grab';
    }

    switch (tool) {
      case 'eraser':
        return "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"white\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m7 21-4.3-4.3c-.9-.9-.9-2.3 0-3.2l9.6-9.6c.9-.9 2.3-.9 3.2 0l5.6 5.6c.9.9.9 2.3 0 3.2L13 21\"/><path d=\"M22 21H7\"/><path d=\"m5 11 9 9\"/></svg>') 12 12, auto";
      default:
        return 'crosshair';
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !isSpacePressed) {
      e.preventDefault();
      setIsSpacePressed(true);
      previousToolRef.current = tool;
      setTool('hand');
    }

    if (e.code === 'KeyE' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      toggleEraser();
    }

    if (e.ctrlKey || e.metaKey) {
      switch (e.code) {
        case 'Equal':
        case 'NumpadAdd':
          e.preventDefault();
          handleZoom(true);
          break;
        case 'Minus':
        case 'NumpadSubtract':
          e.preventDefault();
          handleZoom(false);
          break;
        case 'Digit0':
          e.preventDefault();
          resetZoom();
          break;
        case 'KeyZ':
          if (e.shiftKey) {
            e.preventDefault();
            redo();
          } else {
            e.preventDefault();
            undo();
          }
          break;
      }
    }

    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      switch (e.code) {
        case 'KeyD':
          e.preventDefault();
          setTool('draw');
          break;
        case 'KeyH':
          e.preventDefault();
          toggleHandTool();
          break;
        case 'Escape':
          e.preventDefault();
          setSelectedElementIds([]);
          break;
        case 'Digit1':
          e.preventDefault();
          setBrushType('pencil');
          setTool('draw');
          break;
        case 'Digit2':
          e.preventDefault();
          setBrushType('marker');
          setTool('draw');
          break;
        case 'Digit3':
          e.preventDefault();
          setBrushType('highlighter');
          setTool('draw');
          break;
        case 'KeyT':
          e.preventDefault();
          setTool('text');
          break;
      }
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      setIsSpacePressed(false);
      setTool(previousToolRef.current);
    }
  };

  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas, 0, 0);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    setCanvasDimensions({
      width: canvas.width,
      height: canvas.height
    });

    ctx.fillStyle = canvasBackgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.strokeStyle = selectedColor;
  };

  const resetCanvas = () => {
    console.log('RESET CANVAS');
    
    // Reset all state first
    setIsDrawing(false);
    setIsEraserEnabled(false);
    setTool('draw');
    setIsPanning(false);
    setLastPanPoint(null);
    setIsHandTool(false);
    setIsSpacePressed(false);
    setLastPoint(null);
    setViewport(DEFAULT_VIEWPORT);
    setResult(null);
    setError(null);
    setLatexExpression([]);
    setVariable({});
    setBrushType('pencil');
    setBrushSize(5);
    setBrushOpacity(1);
    setEraserSize(20);
    setElements([]); // Clear elements
    
    // Clear canvas immediately
    const canvas = canvasRef.current;
    if (canvas && typeof window !== "undefined") {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        setCanvasDimensions({
          width: canvas.width,
          height: canvas.height
        });

        const worldCanvas = worldCanvasRef.current;
        if (worldCanvas) {
          const worldCtx = worldCanvas.getContext('2d');
          worldCtx?.clearRect(0, 0, worldCanvas.width, worldCanvas.height);
        }

        // Set drawing properties
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Clear canvas with background
        ctx.fillStyle = canvasBackgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        drawTransformedGrid(ctx);

        // Focus canvas
        if (typeof canvas.focus === "function") {
          canvas.focus();
        }
      }
    }
    
    // Reset history AFTER clearing canvas - start fresh with single empty state
    setHistory([[]]);
    setHistoryIndex(0);
    
    // Save the clean empty state as the first history entry
    setTimeout(() => {
      if (canvas) {
        saveCanvasState();
        console.log('Reset complete - history reset to 1/1');
      }
    }, 10);
  };

  const sendData = async () => {
    const strokesToAnalyze = selectedElementIds.length > 0
      ? elements.filter(el => selectedElementIds.includes(el.id))
      : elements;

    if (strokesToAnalyze.length === 0) {
      setError("Nothing to analyze. Please draw something first.");
      return;
    }
    
    const boundingBox = getStrokesBoundingBox(strokesToAnalyze);
    if (!boundingBox) {
      setError("Could not determine the area to analyze.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const PADDING = 20;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = boundingBox.width + PADDING * 2;
    tempCanvas.height = boundingBox.height + PADDING * 2;
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) {
      setError("Could not create a temporary canvas for analysis.");
      setIsLoading(false);
      return;
    }

    // White background for better recognition
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    tempCtx.translate(-boundingBox.x + PADDING, -boundingBox.y + PADDING);

    strokesToAnalyze.forEach(stroke => {
      tempCtx.beginPath();
      tempCtx.strokeStyle = stroke.color === 'white' ? 'black' : stroke.color; // Ensure visibility on white bg
      tempCtx.lineWidth = stroke.brushSize;
      tempCtx.globalAlpha = stroke.opacity;
      
      const path = getStrokeAsPath(stroke);
      tempCtx.stroke(new Path2D(path));
    });

    try {
      const imageData = tempCanvas.toDataURL("image/png");
      
      const response = await axios({
        method: "POST",
        url: "/api/calculate",
        data: {
          image: imageData,
          variable: variable,
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      const generatedResult: GeneratedResult = response.data;
      setResult(generatedResult);
    } catch (err: any) {
      setError(err?.message || "An error occurred");
      console.error("Error analyzing image:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setSelectedElementIds([]);
    
    // Only switch to hand tool for immediate panning, don't auto-center
    if (tool !== 'hand') {
      previousToolRef.current = tool;
      setTool('hand');
    }
  };

  const zoomToSelection = () => {
    if (!selection) return;

    const selectedStrokes = elements.filter(el => selectedElementIds.includes(el.id));
    if (selectedStrokes.length === 0) return;

    const boundingBox = getStrokesBoundingBox(selectedStrokes);
    if (!boundingBox) return;

    const padding = 50; // Add some padding
    const newWidth = boundingBox.width + padding * 2;
    const newHeight = boundingBox.height + padding * 2;

    const currentCenterX = window.innerWidth / 2;
    const currentCenterY = window.innerHeight / 2;

    const newX = currentCenterX - newWidth / 2;
    const newY = currentCenterY - newHeight / 2;

    const newZoom = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, Math.min(window.innerWidth / newWidth, window.innerHeight / newHeight))
    );

    setViewport({ x: newX, y: newY, zoom: newZoom });
  };

  const scaleSelection = (scaleFactor: number) => {
    const selectedStrokes = elements.filter(el => selectedElementIds.includes(el.id));
    if (selectedStrokes.length === 0) return;

    const boundingBox = getStrokesBoundingBox(selectedStrokes);
    if (!boundingBox) return;

    const centerX = boundingBox.x + boundingBox.width / 2;
    const centerY = boundingBox.y + boundingBox.height / 2;

    const updatedElements = elements.map(el => {
      if (!selectedElementIds.includes(el.id)) return el;

      return {
        ...el,
        points: el.points.map(p => ({
          x: (p.x - centerX) * scaleFactor + centerX,
          y: (p.y - centerY) * scaleFactor + centerY,
        })),
      };
    });
    
    setElements(updatedElements);

    // Save state
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updatedElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  return {
    canvasRef,
    worldCanvasRef,
    minimapRef,
    canvasDimensions,
    isDrawing,
    selectedColor,
    reset,
    result,
    variable,
    isLoading,
    error,
    latexPosition: centerPoint,
    latexExpression,
    isErasing: isEraserEnabled,
    draggingLatex: null,
    isEraserEnabled,
    historyIndex,
    canUndo,
    canRedo,
    viewport,
    lastPanPoint,
    isPanning,
    isPanningSelection,
    isHandTool,
    isSpacePressed,
    tool,
    brushType,
    brushSize,
    brushOpacity,
    eraserSize,
    centerPoint,
    gridSize: 20,
    showMinimap,
    canvasBackgroundColor,
    lastPoint,
    selection,
    selectionViewport,
    elements,
    selectedElementIds,
    drawingState,
    setSelectedColor,
    setIsEraserEnabled,
    setViewport,
    setLastPanPoint,
    setIsPanning,
    setIsPanningSelection,
    setTool,
    setShowMinimap,
    setBrushType,
    setBrushSize,
    setBrushOpacity,
    setEraserSize,
    setCanvasBackgroundColor,
    setSelection,
    setSelectionViewport,
    handleKeyDown,
    handleKeyUp,
    handleResize,
    initializeCanvas,
    drawGrid,
    saveCanvasState,
    undo,
    redo,
    restoreElements,
    resetCanvas,
    sendData,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseOut,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
    handleContextMenu,
    handleDoubleClick,
    handleZoom,
    zoomToPoint,
    panBy,
    resetZoom,
    centerCanvas,
    toggleHandTool,
    toggleEraser,
    getCursor,
    setElements,
    setSelectedElementIds,
    zoomToSelection,
    scaleSelection,
  };
};
