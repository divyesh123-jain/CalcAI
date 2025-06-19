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
  saveToHistory: (imageData: string) => void;
  undo: () => void;
  redo: () => void;
  restoreCanvasState: (imageData: string) => void;
  resetCanvas: () => void;
  sendData: () => Promise<void>;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: () => void;
  handleMouseOut: () => void;
  handleWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
  handleContextMenu: (e: React.MouseEvent<HTMLCanvasElement>) => void;
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
  const [history, setHistory] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);

  // Viewport state
  const [viewport, setViewport] = useState<ViewPort>(DEFAULT_VIEWPORT);
  const [lastPanPoint, setLastPanPoint] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [centerPoint, setCenterPoint] = useState<Point>({ x: 0, y: 0 });
  const [showMinimap, setShowMinimap] = useState(true);

  // Initialize canvas and event listeners
  useEffect(() => {
    initializeCanvas();
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown as EventListener);
    window.addEventListener("keyup", handleKeyUp as EventListener);

    setCenterPoint({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown as EventListener);
      window.removeEventListener("keyup", handleKeyUp as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // CANVAS INITIALIZATION
  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = typeof window !== "undefined" ? window.innerWidth : 800;
    canvas.height = typeof window !== "undefined" ? window.innerHeight : 600;

    setCanvasDimensions({
      width: canvas.width,
      height: canvas.height
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
    ctx.save();

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

    ctx.restore();

    // Draw simple grid
    drawGrid(ctx);

    // Initialize history
    const initialState = canvas.toDataURL();
    setHistory([initialState]);
    setCurrentStep(0);

    // Force canvas to be immediately interactive
    if (typeof canvas.focus === "function") {
      canvas.focus();
    }

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
    ctx.fillStyle = canvasBackgroundColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

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

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'hand' || e.button === 2 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    } else if (tool === 'draw' || tool === 'eraser') {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const pressure = (e as any).pressure || 1;

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

      ctx.beginPath();
      ctx.moveTo(x, y);

      ctx.beginPath();
      ctx.arc(x, y, ctx.lineWidth / 4, 0, Math.PI * 2);
      ctx.fill();

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
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;

      setViewport(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));

      setLastPanPoint({ x: e.clientX, y: e.clientY });
    } else if (isDrawing && lastPoint) {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dx = x - lastPoint.x;
      const dy = y - lastPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0.5) {
        const midX = (lastPoint.x + x) / 2;
        const midY = (lastPoint.y + y) / 2;

        ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midX, midY);
        ctx.stroke();

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

    const img = new window.Image();
    img.onload = () => {
      ctx.fillStyle = canvasBackgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = imageData;
  };

  const resetCanvas = () => {
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
    }, 50);
  };

  const sendData = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsLoading(true);
      setError(null);

      const imageData = canvas.toDataURL("image/png");
      const response = await axios({
        method: "POST",
        url: "http://localhost:3000/api/calculate",
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
    latexPosition: { x: 0, y: 0 },
    latexExpression,
    isErasing: false,
    draggingLatex: null,
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
