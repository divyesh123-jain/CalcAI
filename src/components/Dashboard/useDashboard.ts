/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { BrushType, Tool } from "../../lib/types";

interface Point {
  x: number;
  y: number;
}

interface ViewPort {
  x: number;
  y: number;
  zoom: number;
}

interface GeneratedResult {
  expression: string;
  answer: string;
  steps?: string[];
}

interface CanvasDimensions {
  width: number;
  height: number;
}

interface UseDashboardReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
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
  canvasHistory: string[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  viewport: ViewPort;
  lastPanPoint: Point | null;
  isPanning: boolean;
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
  setSelectedColor: React.Dispatch<React.SetStateAction<string>>;
  setIsEraserEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setViewport: React.Dispatch<React.SetStateAction<ViewPort>>;
  setLastPanPoint: React.Dispatch<React.SetStateAction<Point | null>>;
  setIsPanning: React.Dispatch<React.SetStateAction<boolean>>;
  setTool: (tool: Tool) => void;
  setShowMinimap: React.Dispatch<React.SetStateAction<boolean>>;
  setBrushType: React.Dispatch<React.SetStateAction<BrushType>>;
  setBrushSize: React.Dispatch<React.SetStateAction<number>>;
  setBrushOpacity: React.Dispatch<React.SetStateAction<number>>;
  setEraserSize: React.Dispatch<React.SetStateAction<number>>;
  setCanvasBackgroundColor: React.Dispatch<React.SetStateAction<string>>;
  handleKeyDown: (e: KeyboardEvent) => void;
  handleKeyUp: (e: KeyboardEvent) => void;
  handleResize: () => void;
  initializeCanvas: () => void;
  drawGrid: (ctx: CanvasRenderingContext2D) => void;
  saveCanvasState: () => void;
  undo: () => void;
  redo: () => void;
  restoreCanvasFromImage: (imageData: string) => void;
  resetCanvas: () => void;
  sendData: (texts?: Array<{id: string, text: string, x: number, y: number, rotation: number}>, textStyle?: {fontFamily: string, fontSize: number, color: string, opacity: number, fontWeight: string, fontStyle: string}) => Promise<void>;
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
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 5;
const ZOOM_SENSITIVITY = 0.001;
const PAN_SENSITIVITY = 1.2;
const DEFAULT_VIEWPORT: ViewPort = { x: 0, y: 0, zoom: 1 };

export const useDashboard = (): UseDashboardReturn => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
  const [eraserSize, setEraserSize] = useState(10);
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState("#000000");
  const [lastPoint, setLastPoint] = useState<Point | null>(null);

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

  // History - pure canvas snapshots
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Viewport state
  const [viewport, setViewport] = useState<ViewPort>(DEFAULT_VIEWPORT);
  const [lastPanPoint, setLastPanPoint] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const [centerPoint] = useState<Point>({ 
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 400, 
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 300 
  });
  const [showMinimap, setShowMinimap] = useState(true);

  // Check if we can undo/redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < canvasHistory.length - 1;

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
  }, [canvasRef.current, canvasBackgroundColor]);

  // Redraw canvas when viewport changes
  useEffect(() => {
    redrawCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport]);

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
    saveCanvasState();

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

  // Redraw the entire canvas with viewport transformation
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas with background
    ctx.fillStyle = canvasBackgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw transformed grid
    drawTransformedGrid(ctx);

    // Restore the previous drawing if any
    if (canvasHistory.length > 0 && historyIndex >= 0) {
      const imageData = canvasHistory[historyIndex];
      if (imageData) {
        const img = new Image();
        img.onload = () => {
          ctx.save();
          ctx.translate(viewport.x, viewport.y);
          ctx.scale(viewport.zoom, viewport.zoom);
          ctx.drawImage(img, 0, 0);
          ctx.restore();
        };
        img.src = imageData;
        return;
      }
    }
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

  // PURE CANVAS DRAWING WITH VIEWPORT SUPPORT
  const startDrawing = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    console.log('Start drawing at:', { x, y });

    // Transform screen coordinates to world coordinates
    const worldX = (x - viewport.x) / viewport.zoom;
    const worldY = (y - viewport.y) / viewport.zoom;

    // Set drawing style
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = canvasBackgroundColor; // Use background color for eraser
      ctx.lineWidth = eraserSize / viewport.zoom;
      ctx.globalAlpha = 1; // Full opacity for eraser
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
      const baseWidth = brushSize;
      ctx.lineWidth = baseWidth / viewport.zoom;
      ctx.globalAlpha = brushOpacity;
    }
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Apply viewport transformation
    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    // Start drawing in world coordinates
    ctx.beginPath();
    ctx.moveTo(worldX, worldY);
    
    setIsDrawing(true);
    setLastPoint({ x: worldX, y: worldY });
  };

  const continueDrawing = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !lastPoint || !isDrawing) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Transform screen coordinates to world coordinates
    const worldX = (x - viewport.x) / viewport.zoom;
    const worldY = (y - viewport.y) / viewport.zoom;

    // Continue drawing in world coordinates
    ctx.lineTo(worldX, worldY);
    ctx.stroke();
    
    setLastPoint({ x: worldX, y: worldY });
  };

  const finishDrawing = () => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Restore transformation
    ctx.restore();
    ctx.globalAlpha = 1; // Reset global alpha
    
    setIsDrawing(false);
    setLastPoint(null);

    // Save canvas state after drawing
    saveCanvasState();
    console.log('Drawing finished, canvas state saved');
  };

  // UNDO/REDO WITH CANVAS SNAPSHOTS
  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL();
    
    // Remove any history after current index (for branching)
    const newHistory = canvasHistory.slice(0, historyIndex + 1);
    newHistory.push(imageData);
    
    setCanvasHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    console.log('Canvas state saved. Index:', newHistory.length - 1, 'Total:', newHistory.length);
  };

  const undo = () => {
    console.log('Undo - Current index:', historyIndex, 'History length:', canvasHistory.length);
    
    if (historyIndex <= 0) {
      console.log('Cannot undo - at beginning');
      return;
    }
    
    const newIndex = historyIndex - 1;
    const imageData = canvasHistory[newIndex];
    
    setHistoryIndex(newIndex);
    restoreCanvasFromImage(imageData);
    
    console.log('Undo to index:', newIndex);
  };

  const redo = () => {
    console.log('Redo - Current index:', historyIndex, 'History length:', canvasHistory.length);
    
    if (historyIndex >= canvasHistory.length - 1) {
      console.log('Cannot redo - at end');
      return;
    }
    
    const newIndex = historyIndex + 1;
    const imageData = canvasHistory[newIndex];
    
    setHistoryIndex(newIndex);
    restoreCanvasFromImage(imageData);
    
    console.log('Redo to index:', newIndex);
  };

  const restoreCanvasFromImage = (imageData: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Clear and restore exactly what was saved
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      console.log('Canvas restored from image');
    };
    img.src = imageData;
  };

  // MOUSE HANDLING
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('=== MOUSE DOWN ===');
    console.log('Tool:', tool, 'Button:', e.button);
    
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
    } else if (tool === 'draw' || tool === 'eraser') {
      console.log('STARTING DRAWING');
      startDrawing(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
      
    } else if (isDrawing && lastPoint) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      continueDrawing(x, y);
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

    if (isDrawing) {
      console.log('STOPPING DRAWING');
      finishDrawing();
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
      
    } else if (isDrawing && lastPoint) {
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

    if (isDrawing) {
      console.log('STOPPING TOUCH DRAWING');
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
    if (newTool !== 'eraser') {
      setIsEraserEnabled(false);
    }
    setToolInternal(newTool);
  };

  const toggleEraser = () => {
    if (tool === 'eraser' || isEraserEnabled) {
      setTool('draw');
      setIsEraserEnabled(false);
    } else {
      previousToolRef.current = tool;
      setTool('eraser');
      setIsEraserEnabled(true);
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
    setEraserSize(10);
    
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
    setCanvasHistory([]);
    setHistoryIndex(-1);
    
    // Save the clean empty state as the first history entry
    setTimeout(() => {
      if (canvas) {
        const imageData = canvas.toDataURL();
        setCanvasHistory([imageData]);
        setHistoryIndex(0);
        console.log('Reset complete - history reset to 1/1');
      }
    }, 10);
  };

  const sendData = async (texts?: Array<{id: string, text: string, x: number, y: number, rotation: number}>, textStyle?: {fontFamily: string, fontSize: number, color: string, opacity: number, fontWeight: string, fontStyle: string}) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsLoading(true);
      setError(null);

      // Create a temporary canvas to combine drawn content and text
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Set same dimensions as main canvas
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;

      // Copy the main canvas content
      tempCtx.drawImage(canvas, 0, 0);

      // Render text elements onto the temporary canvas if provided
      if (texts && textStyle) {
        texts.forEach(textElement => {
          if (textElement.text.trim()) {
            tempCtx.save();
            
            // Move to text position and apply rotation
            tempCtx.translate(textElement.x, textElement.y);
            tempCtx.rotate((textElement.rotation * Math.PI) / 180);
            
            // Set text styling
            tempCtx.font = `${textStyle.fontStyle} ${textStyle.fontWeight} ${textStyle.fontSize}px ${textStyle.fontFamily}`;
            tempCtx.fillStyle = textStyle.color;
            tempCtx.globalAlpha = textStyle.opacity;
            tempCtx.textAlign = 'left';
            tempCtx.textBaseline = 'top';
            
            // Handle multi-line text
            const lines = textElement.text.split('\n');
            lines.forEach((line, index) => {
              tempCtx.fillText(line, 0, index * textStyle.fontSize * 1.2);
            });
            
            tempCtx.restore();
          }
        });
      }

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
    console.log('=== DOUBLE CLICK ===');
    
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    // Only switch to hand tool for immediate panning, don't auto-center
    if (tool !== 'hand') {
      previousToolRef.current = tool;
      setTool('hand');
    }
    
    // Prevent any default double-click behavior
    e.preventDefault();
  };

  return {
    canvasRef,
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
    canvasHistory,
    historyIndex,
    canUndo,
    canRedo,
    viewport,
    lastPanPoint,
    isPanning,
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
    setSelectedColor,
    setIsEraserEnabled,
    setViewport,
    setLastPanPoint,
    setIsPanning,
    setTool,
    setShowMinimap,
    setBrushType,
    setBrushSize,
    setBrushOpacity,
    setEraserSize,
    setCanvasBackgroundColor,
    handleKeyDown,
    handleKeyUp,
    handleResize,
    initializeCanvas,
    drawGrid,
    saveCanvasState,
    undo,
    redo,
    restoreCanvasFromImage,
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
    getCursor
  };
};
