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

// interface Response {
//   expr: string;
//   result: string;
//   assign: boolean;
// }

interface GeneratedResult {
  expression: string;
  answer: string;
}

interface CanvasDimensions {
  width: number;
  height: number;
}

// interface CanvasLayers {
//   grid: HTMLCanvasElement | null;
//   drawing: HTMLCanvasElement | null;
//   temp: HTMLCanvasElement | null;
// }

interface UseDashboardReturn {
  // Refs - SINGLE CANVAS SYSTEM
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  minimapRef: React.RefObject<HTMLCanvasElement | null>;
  
  // State variables
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
  history: string[];
  currentStep: number;
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

  // Setters
  setSelectedColor: React.Dispatch<React.SetStateAction<string>>;
  setIsEraserEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setViewport: React.Dispatch<React.SetStateAction<ViewPort>>;
  setLastPanPoint: React.Dispatch<React.SetStateAction<Point | null>>;
  setIsPanning: React.Dispatch<React.SetStateAction<boolean>>;
  setTool: (tool: Tool) => void;
  setShowMinimap: React.Dispatch<React.SetStateAction<boolean>>;
  setBrushType: React.Dispatch<React.SetStateAction<BrushType>>;
  setCanvasBackgroundColor: React.Dispatch<React.SetStateAction<string>>;
  
  // Methods
  handleKeyDown: (e: KeyboardEvent) => void;
  handleKeyUp: (e: KeyboardEvent) => void;
  handleResize: () => void;
  initializeCanvas: () => void;
  drawGrid: (ctx: CanvasRenderingContext2D) => void;
  saveToHistory: (imageData: string) => void;
  undo: () => void;
  redo: () => void;
  restoreCanvasState: (imageData: string) => void;
  resetCanvas: () => void;
  sendData: () => Promise<void>;
  
  // Drawing methods
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: () => void;
  handleMouseOut: () => void;
  handleWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
  handleContextMenu: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  
  // Navigation methods
  handleZoom: (zoomIn: boolean) => void;
  zoomToPoint: (newZoom: number, x: number, y: number) => void;
  panBy: (dx: number, dy: number) => void;
  resetZoom: () => void;
  centerCanvas: () => void;
  toggleHandTool: () => void;
  toggleEraser: () => void;
  getCursor: () => string;
}

// Constants
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
    width: 1024,  // Default width
    height: 768   // Default height
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

  // LaTeX state
  const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });
  const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
  const [isErasing, setIsErasing] = useState(false);
  const [draggingLatex, setDraggingLatex] = useState<string | null>(null);

  // Tools state
  const [isEraserEnabled, setIsEraserEnabled] = useState(false);
  const [tool, setToolState] = useState<Tool>('draw');
  const [isHandTool, setIsHandTool] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // History state
  const [history, setHistory] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);

  // Viewport state
  const [viewport, setViewport] = useState<ViewPort>(DEFAULT_VIEWPORT);
  const [lastPanPoint, setLastPanPoint] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [centerPoint, setCenterPoint] = useState<Point>({ x: 0, y: 0 });
  const [gridSize, setGridSize] = useState(20);
  const [showMinimap, setShowMinimap] = useState(true);

  // Initialize dimensions on client-side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCanvasDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
  }, []);

  // Initialize canvas and event listeners
  useEffect(() => {
    initializeCanvas();
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown as unknown as EventListener);
    window.addEventListener("keyup", handleKeyUp as unknown as EventListener);

    setCenterPoint({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown as unknown as EventListener);
      window.removeEventListener("keyup", handleKeyUp as unknown as EventListener);
    };
  }, []);

  // Re-initialize canvas when canvasRef changes (like after remount)
  useEffect(() => {
    if (canvasRef.current) {
      initializeCanvas();
    }
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
  }, [reset]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input field
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'd':
          event.preventDefault();
          setTool('draw');
          break;
        case 's':
          event.preventDefault();
          setTool('select');
          break;
        case 'h':
          event.preventDefault();
          setTool('hand');
          break;
        case 't':
          event.preventDefault();
          setTool('text');
          break;
        case 'e':
          event.preventDefault();
          toggleEraser();
          break;
        case 'z':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (event.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
        case 'r':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            resetCanvas();
          }
          break;
        case '=':
        case '+':
          event.preventDefault();
          handleZoom(true);
          break;
        case '-':
          event.preventDefault();
          handleZoom(false);
          break;
        case '0':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            centerCanvas();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // CANVAS INITIALIZATION
  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    setCanvasDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });

    // Clear and setup canvas
    ctx.fillStyle = canvasBackgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set ALL drawing properties immediately so canvas is ready
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.strokeStyle = selectedColor;

    // Pre-configure the context for immediate drawing readiness
    ctx.save(); // Save the clean state
    
    // Set up drawing properties based on current tool and brush
    if (tool === 'eraser' || isEraserEnabled) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 20;
      ctx.globalAlpha = 1;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
      
      switch (brushType) {
        case 'pencil':
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.9;
          break;
        case 'marker':
          ctx.lineWidth = 8;
          ctx.globalAlpha = 0.9;
          break;
        case 'highlighter':
          ctx.lineWidth = 15;
          ctx.globalAlpha = 0.4;
          break;
        default:
          ctx.lineWidth = 3;
          ctx.globalAlpha = 1;
          break;
      }
    }
    
    ctx.restore(); // Restore clean state but keep context ready

    // Draw simple grid
    drawGrid(ctx);

    // Initialize history
    const initialState = canvas.toDataURL();
    setHistory([initialState]);
    setCurrentStep(0);
    
    // Force canvas to be immediately interactive
    canvas.focus();
    
    // Trigger a small invisible operation to "wake up" the canvas
    ctx.save();
    ctx.globalAlpha = 0;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0.1, 0.1);
    ctx.stroke();
    ctx.restore();
  };

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    // Fill background
    ctx.fillStyle = canvasBackgroundColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Simple dot grid
    const gridSpacing = 30;
    const dotSize = 1;
    const isLight = canvasBackgroundColor === '#ffffff' || canvasBackgroundColor === '#fff';
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';

    ctx.fillStyle = gridColor;

    for (let x = gridSpacing; x < ctx.canvas.width; x += gridSpacing) {
      for (let y = gridSpacing; y < ctx.canvas.height; y += gridSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // DRAWING METHODS - COMPLETELY NEW SIMPLE SYSTEM
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'hand' || e.buttons === 2 || (e.buttons === 1 && e.altKey)) {
      // Start panning
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    } else if (tool === 'draw' || tool === 'eraser') {
      // Start drawing
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Get pressure (for supported devices)
      const pressure = (e as any).pressure || 1;

      // Set drawing properties with pressure sensitivity
      if (tool === 'eraser' || isEraserEnabled) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 20 * pressure;
        ctx.globalAlpha = 1;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = selectedColor;
        
        switch (brushType) {
          case 'pencil':
            ctx.lineWidth = Math.max(1, 2 * pressure);
            ctx.globalAlpha = 0.8 + (pressure * 0.2);
            break;
          case 'marker':
            ctx.lineWidth = Math.max(3, 8 * pressure);
            ctx.globalAlpha = 0.9;
            break;
          case 'highlighter':
            ctx.lineWidth = Math.max(5, 15 * pressure);
            ctx.globalAlpha = 0.4;
            break;
          default:
            ctx.lineWidth = Math.max(2, 3 * pressure);
            ctx.globalAlpha = 1;
            break;
        }
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Start drawing path and draw a small dot at the start position
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      // Draw a small circle at start for immediate feedback
      ctx.arc(x, y, ctx.lineWidth / 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Start the stroke path
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      setIsDrawing(true);
      setLastPoint({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isPanning && lastPanPoint) {
      // Handle panning
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;

      setViewport(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));

      setLastPanPoint({ x: e.clientX, y: e.clientY });
    } else if (isDrawing && lastPoint) {
      // Handle drawing with smooth interpolation
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Calculate distance for smoothing
      const dx = x - lastPoint.x;
      const dy = y - lastPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Only draw if there's movement to avoid duplicate dots
      if (distance > 0.5) {
        // Use quadratic curve for smoother lines
        const midX = (lastPoint.x + x) / 2;
        const midY = (lastPoint.y + y) / 2;
        
        ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midX, midY);
        ctx.stroke();
        
        // Start new path from current position for next segment
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        
        setLastPoint({ x, y });
      }
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      setLastPanPoint(null);
    }
    
    if (isDrawing) {
      setIsDrawing(false);
      setLastPoint(null);
      
      // Save to history
      const canvas = canvasRef.current;
      if (canvas) {
        const imageData = canvas.toDataURL();
        saveToHistory(imageData);
      }
    }
  };

  const handleMouseOut = () => {
    handleMouseUp();
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  };

  // NAVIGATION METHODS
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, viewport.zoom * (1 + delta)));
      const mouseX = e.nativeEvent.offsetX;
      const mouseY = e.nativeEvent.offsetY;
      zoomToPoint(newZoom, mouseX, mouseY);
    } else {
      // Pan
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

  // TOOL METHODS
  const setTool = (newTool: Tool) => {
    if (newTool !== 'eraser') {
      setIsEraserEnabled(false);
    }
    
    if (newTool !== 'hand') {
      setIsHandTool(false);
    }

    setToolState(newTool);
    
    if (tool === 'eraser' || isEraserEnabled) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.globalCompositeOperation = 'source-over';
        }
      }
    }

    previousToolRef.current = tool;
  };

  const toggleEraser = () => {
    if (tool === 'eraser' || isEraserEnabled) {
      setTool('draw');
      setIsEraserEnabled(false);
      setIsErasing(false);
    } else {
      previousToolRef.current = tool;
      setTool('eraser');
      setIsEraserEnabled(true);
      setIsErasing(true);
    }
  };

  const toggleHandTool = () => {
    if (tool !== 'hand') {
      previousToolRef.current = tool;
      setTool('hand');
    } else {
      setTool(previousToolRef.current);
    }
  };

  const getCursor = (): string => {
    if (tool === 'hand' || isSpacePressed) return 'grab';
    if (tool === 'eraser' || isEraserEnabled) return 'crosshair';
    if (tool === 'text') return 'text';
    if (tool === 'select') return 'default';
    return 'crosshair'; // default for draw tool
  };

  // KEYBOARD HANDLING
  const handleKeyDown = (e: KeyboardEvent) => {
    // Prevent default for canvas shortcuts
    const isCanvasFocused = document.activeElement === canvasRef.current;
    
    if (isCanvasFocused || e.target === document.body) {
      switch (e.key.toLowerCase()) {
        case ' ':
          if (!isSpacePressed) {
            setIsSpacePressed(true);
            previousToolRef.current = tool;
            e.preventDefault();
          }
          break;
        case 'd':
          if (!e.ctrlKey && !e.metaKey) {
            setTool('draw');
            e.preventDefault();
          }
          break;
        case 'h':
          if (!e.ctrlKey && !e.metaKey) {
            toggleHandTool();
            e.preventDefault();
          }
          break;
        case 't':
          if (!e.ctrlKey && !e.metaKey) {
            setTool('text');
            e.preventDefault();
          }
          break;
        case 'e':
          if (!e.ctrlKey && !e.metaKey) {
            toggleEraser();
            e.preventDefault();
          }
          break;
        case '1':
          setBrushType('pencil');
          setTool('draw');
          e.preventDefault();
          break;
        case '2':
          setBrushType('marker');
          setTool('draw');
          e.preventDefault();
          break;
        case '3':
          setBrushType('highlighter');
          setTool('draw');
          e.preventDefault();
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            e.preventDefault();
          }
          break;
        case 'y':
          if (e.ctrlKey || e.metaKey) {
            redo();
            e.preventDefault();
          }
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

    // Save current canvas content
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas, 0, 0);

    // Resize canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    setCanvasDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });

    // Restore content
    ctx.fillStyle = canvasBackgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
    
    // Reset drawing properties
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.strokeStyle = selectedColor;
  };

  // HISTORY METHODS
  const saveToHistory = (imageData: string) => {
    const newHistory = history.slice(0, currentStep + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setCurrentStep(newHistory.length - 1);
  };

  const undo = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      restoreCanvasState(history[currentStep - 1]);
    }
  };

  const redo = () => {
    if (currentStep < history.length - 1) {
      setCurrentStep(currentStep + 1);
      restoreCanvasState(history[currentStep + 1]);
    }
  };

  const restoreCanvasState = (imageData: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = canvasBackgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = imageData;
  };

  const resetCanvas = () => {
    // Reset all state
    setIsDrawing(false);
    setIsErasing(false);
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

    // Small delay to ensure state updates, then reinitialize
    setTimeout(() => {
      initializeCanvas();
      
      // Ensure canvas is immediately ready for drawing
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Pre-setup drawing properties so first click works immediately
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.lineWidth = 3;
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1;
          ctx.strokeStyle = selectedColor;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
        }
        
        // Ensure canvas has focus for immediate interaction
        canvas.focus();
      }
    }, 50);
  };

  const sendData = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setError("Canvas not found");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get image data and log its size
      const imageData = canvas.toDataURL("image/png");
      console.log("Image data length:", imageData.length);
      console.log("First 100 chars of image data:", imageData.substring(0, 100));

      if (!imageData.startsWith('data:image/png;base64,')) {
        throw new Error("Invalid image format");
      }

      const response = await axios({
        method: "POST",
        url: "http://localhost:3000/api/calculate", // Use relative URL
        data: {
          image: imageData,
          variable: variable,
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("API Response:", response.data);

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const generatedResult: GeneratedResult = response.data;
      setResult(generatedResult);
    } catch (err) {
      console.error("Error sending data:", err);
      setError(
        err instanceof Error 
          ? err.message 
          : "Failed to process the mathematical expression"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Refs
    canvasRef,
    minimapRef,
    
    // State variables
    canvasDimensions,
    isDrawing,
    selectedColor,
    reset,
    result,
    variable,
    isLoading,
    error,
    latexPosition,
    latexExpression,
    isErasing,
    draggingLatex,
    isEraserEnabled,
    history,
    currentStep,
    viewport,
    lastPanPoint,
    isPanning,
    isHandTool,
    isSpacePressed,
    tool,
    brushType,
    centerPoint,
    gridSize,
    showMinimap,
    canvasBackgroundColor,
    lastPoint,
    
    // Setters
    setSelectedColor,
    setIsEraserEnabled,
    setViewport,
    setLastPanPoint,
    setIsPanning,
    setTool,
    setShowMinimap,
    setBrushType,
    setCanvasBackgroundColor,
    
    // Methods
    handleKeyDown,
    handleKeyUp,
    handleResize,
    initializeCanvas,
    drawGrid,
    saveToHistory,
    undo,
    redo,
    restoreCanvasState,
    resetCanvas,
    sendData,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseOut,
    handleWheel,
    handleContextMenu,
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
