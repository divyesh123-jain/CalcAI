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

const MIN_ZOOM = 0.1;
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

  // History state
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Clean up unused state 
  const [historyStates] = useState<Array<Array<{
    type: 'stroke' | 'dot';
    points: Point[];
    style: {
      color: string;
      lineWidth: number;
      tool: string;
    };
  }>>>([[]]);
  const [currentIndex] = useState(0);

  // Viewport state - simplified
  const [viewport, setViewport] = useState<ViewPort>(DEFAULT_VIEWPORT);
  const [lastPanPoint, setLastPanPoint] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  // Smooth panning state - simplified
  const [isSmoothPanning, setIsSmoothPanning] = useState(false);
  const smoothPanAnimationRef = useRef<number | null>(null);
  const targetViewportRef = useRef<ViewPort | null>(null);
  const startViewportRef = useRef<ViewPort | null>(null);
  const animationStartTimeRef = useRef<number>(0);

  const [centerPoint, setCenterPoint] = useState<Point>({ x: 0, y: 0 });
  const [showMinimap, setShowMinimap] = useState(true);

  // Initialize canvas and event listeners
  useEffect(() => {
    initializeCanvas();

    const handleKeyDownEvent = (e: KeyboardEvent) => {
      handleKeyDown(e);
    };

    const handleKeyUpEvent = (e: KeyboardEvent) => {
      handleKeyUp(e);
    };

    const handleResizeEvent = () => {
      handleResize();
    };

    window.addEventListener("keydown", handleKeyDownEvent);
    window.addEventListener("keyup", handleKeyUpEvent);
    window.addEventListener("resize", handleResizeEvent);

    setCenterPoint({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDownEvent);
      window.removeEventListener("keyup", handleKeyUpEvent);
      window.removeEventListener("resize", handleResizeEvent);
      if (smoothPanAnimationRef.current) {
        cancelAnimationFrame(smoothPanAnimationRef.current);
      }
    };
  }, []);

  // Re-initialize canvas when canvasRef changes (like after remount)
  useEffect(() => {
    if (canvasRef.current) {
      initializeCanvas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef.current, selectedColor, canvasBackgroundColor]);

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

  // SIMPLE CANVAS INITIALIZATION
  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
    drawSimpleGrid(ctx);

    // Save initial empty state
    saveCanvasState();

    console.log('Canvas initialized:', { width: canvas.width, height: canvas.height });
  };

  // Simple grid that doesn't interfere with anything
  const drawSimpleGrid = (ctx: CanvasRenderingContext2D) => {
    const gridSpacing = 50;
    const dotSize = 2;
    
    ctx.save();
    ctx.fillStyle = canvasBackgroundColor === '#000000' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    
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

  // PURE CANVAS DRAWING - no operations array
  const startDrawing = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    console.log('Start drawing at:', { x, y });

    // Set drawing style
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 20;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = brushType === 'pencil' ? 2 : brushType === 'marker' ? 8 : 15;
    }
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Start drawing
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    setIsDrawing(true);
    setLastPoint({ x, y });
  };

  const continueDrawing = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !lastPoint || !isDrawing) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw line to current position
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setLastPoint({ x, y });
  };

  const finishDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    setLastPoint(null);

    // Save canvas state after drawing
    saveCanvasState();
    console.log('Drawing finished, canvas state saved');
  };

  // SIMPLE UNDO/REDO WITH CANVAS SNAPSHOTS ONLY
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

  // Check if we can undo/redo
  const canUndo = () => historyIndex > 0;
  const canRedo = () => historyIndex < canvasHistory.length - 1;

  const resetCanvas = () => {
    console.log('RESET CANVAS');
    
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
    
    // Reset history completely
    setCanvasHistory([]);
    setHistoryIndex(-1);

    setTimeout(() => {
      initializeCanvas();

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.lineWidth = 3;
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1;
          ctx.strokeStyle = selectedColor;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
        }

        if (typeof canvas.focus === "function") {
          canvas.focus();
        }
      }
      
      console.log('Reset complete');
    }, 50);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('=== MOUSE DOWN ===');
    console.log('Tool:', tool, 'Button:', e.button);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    console.log('Click position:', { x, y });

    // Stop any smooth panning
    if (isSmoothPanning) {
      cancelAnimationFrame(smoothPanAnimationRef.current!);
      setIsSmoothPanning(false);
    }

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
      
      // Redraw immediately with new viewport for smooth panning
      redrawEverythingFast(newViewport);
      
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

  // REDRAW function that works with operations
  const redrawEverythingFast = (currentViewport: ViewPort = viewport) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = canvasBackgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawSimpleGrid(ctx);

    // Apply viewport transformation
    ctx.save();
    ctx.translate(currentViewport.x, currentViewport.y);
    ctx.scale(currentViewport.zoom, currentViewport.zoom);

    // Redraw all drawing operations
    drawingOperations.forEach(operation => {
      ctx.save();
      
      if (operation.style.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = operation.style.lineWidth;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = operation.style.color;
        ctx.lineWidth = operation.style.lineWidth;
      }
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (operation.type === 'dot' && operation.points.length > 0) {
        const point = operation.points[0];
        ctx.beginPath();
        ctx.arc(point.x, point.y, operation.style.lineWidth / 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (operation.type === 'stroke' && operation.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(operation.points[0].x, operation.points[0].y);
        
        for (let i = 1; i < operation.points.length; i++) {
          const prevPoint = operation.points[i - 1];
          const currentPoint = operation.points[i];
          const midX = (prevPoint.x + currentPoint.x) / 2;
          const midY = (prevPoint.y + currentPoint.y) / 2;
          
          ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, midX, midY);
        }
        
        ctx.stroke();
      }
      
      ctx.restore();
    });

    ctx.restore();
  };

  const handleMouseOut = () => {
    handleMouseUp();
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
    const currentZoom = viewport.zoom;
    const zoomStep = zoomIn ? 0.2 : -0.2;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + zoomStep));

    setViewport(prev => ({ ...prev, zoom: newZoom }));
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
        return "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"white\" stroke=\"white\" stroke-width=\"2\"><path d=\"M19 19H5L17 7l2 2z\"/></svg>') 0 24, auto";
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
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas, 0, 0);

    canvas.width = typeof window !== "undefined" ? window.innerWidth : 800;
    canvas.height = typeof window !== "undefined" ? window.innerHeight : 600;

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

  // SIMPLE SMOOTH PANNING
  const startSmoothPan = (targetX: number, targetY: number) => {
    console.log('Starting smooth pan to:', { targetX, targetY });
    
    if (smoothPanAnimationRef.current) {
      cancelAnimationFrame(smoothPanAnimationRef.current);
    }

    startViewportRef.current = { ...viewport };
    targetViewportRef.current = { ...viewport, x: targetX, y: targetY };
    animationStartTimeRef.current = Date.now();
    setIsSmoothPanning(true);
    
    animateSmooth();
  };

  const animateSmooth = () => {
    if (!startViewportRef.current || !targetViewportRef.current) return;

    const elapsed = Date.now() - animationStartTimeRef.current;
    const duration = 400; // ms
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease-out animation
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    
    const currentX = startViewportRef.current.x + (targetViewportRef.current.x - startViewportRef.current.x) * easedProgress;
    const currentY = startViewportRef.current.y + (targetViewportRef.current.y - startViewportRef.current.y) * easedProgress;
    
    const newViewport = {
      ...viewport,
      x: currentX,
      y: currentY
    };
    
    setViewport(newViewport);

    // Redraw with new viewport - use fast redraw
    redrawEverythingFast(newViewport);

    if (progress < 1) {
      smoothPanAnimationRef.current = requestAnimationFrame(animateSmooth);
    } else {
      setIsSmoothPanning(false);
      startViewportRef.current = null;
      targetViewportRef.current = null;
    }
  };

  // SIMPLE DRAWING DETECTION
  const hasDrawingAt = (x: number, y: number): boolean => {
    // Check if any drawing operations have points near the click position
    const tolerance = 20; // pixels
    
    for (const operation of drawingOperations) {
      for (const point of operation.points) {
        // Convert world coordinates back to screen coordinates
        const screenX = point.x * viewport.zoom + viewport.x;
        const screenY = point.y * viewport.zoom + viewport.y;
        
        const distance = Math.sqrt(
          Math.pow(screenX - x, 2) + Math.pow(screenY - y, 2)
        );
        
        if (distance <= tolerance) {
          console.log('Found drawing near click position');
          return true;
        }
      }
    }

    return false;
  };

  // SIMPLE DOUBLE CLICK HANDLER - simplified without drawing operations
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('=== DOUBLE CLICK ===');
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    console.log('Double-click at:', { x, y });

    // For now, just center the view at clicked point
    const targetX = window.innerWidth / 2 - x;
    const targetY = window.innerHeight / 2 - y;
    
    startSmoothPan(targetX, targetY);
    
    // Switch to hand tool for immediate panning
    if (tool !== 'hand') {
      previousToolRef.current = tool;
      setTool('hand');
    }
  };

  // Simple grid function for return object
  const drawGrid = drawSimpleGrid;

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
    viewport,
    lastPanPoint,
    isPanning,
    isHandTool,
    isSpacePressed,
    tool,
    brushType,
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
