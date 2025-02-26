"use client";
import { useState, useEffect, useRef, KeyboardEvent, WheelEvent } from 'react';
import axios from 'axios';
import { 
  Point, 
  ViewPort, 
  CanvasDimensions, 
  GeneratedResult 
} from '../../lib/types';
import {
  DEFAULT_VIEWPORT,
  ZOOM_SENSITIVITY,
  PAN_SENSITIVITY,
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_SPEED,
  drawGrid,
  transformPoint
} from '../../lib/canvas-utils';

type Tool = 'draw' | 'hand' | 'eraser';

export function useDashboard() {
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // State management
  const [canvasDimensions, setCanvasDimensions] = useState<CanvasDimensions>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState("tomato");
  const [reset, setReset] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [variable, setVariable] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });
  const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
  const [isErasing, setIsErasing] = useState(false);
  const [isEraserEnabled, setIsEraserEnabled] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [viewport, setViewport] = useState<ViewPort>(DEFAULT_VIEWPORT);
  const [lastPanPoint, setLastPanPoint] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [tool, setTool] = useState<Tool>('draw');
  const [drawingHistory, setDrawingHistory] = useState<ImageData | null>(null);
  const [centerPoint, setCenterPoint] = useState<Point>({ x: 0, y: 0 });
  const [gridSize, setGridSize] = useState(20);
  const [showMinimap, setShowMinimap] = useState(true);
  
  const previousToolRef = useRef<Tool>('draw');
  
  // Initialize MathJax
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://polyfill.io/v3/polyfill.min.js?features=es6";
    script.async = true;

    const mathjaxScript = document.createElement("script");
    mathjaxScript.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
    mathjaxScript.async = true;

    document.head.appendChild(script);
    document.head.appendChild(mathjaxScript);

    return () => {
      document.head.removeChild(script);
      document.head.removeChild(mathjaxScript);
    };
  }, []);

  // TypesetPromise for LaTeX rendering
  useEffect(() => {
    if (latexExpression.length > 0) {
      window.MathJax?.typesetPromise?.();
    }
  }, [latexExpression]);

  // Reset canvas effect
  useEffect(() => {
    if (reset) {
      resetCanvas();
      setLatexExpression([]);
      setResult(null);
      setVariable({});
      setReset(false);
    }
  }, [reset]);

  // Initialize canvas and event listeners
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
    }
  }, []);

  // Initialize minimap
  useEffect(() => {
    if (minimapRef.current) {
      const minimapCtx = minimapRef.current.getContext('2d');
      if (minimapCtx) {
        minimapCtx.fillStyle = 'black';
        minimapCtx.fillRect(0, 0, minimapRef.current.width, minimapRef.current.height);
      }
    }
  }, []);

  // Canvas functions
  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const initialState = canvas.toDataURL();
        setHistory([initialState]);
        setCurrentStep(0);
        
        updateCanvas();
      }
    }
  };

  const updateCanvas = (preserveDrawings = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Store current drawings if needed
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

  const updateMinimap = (preserveDrawings = false) => {
    const mainCanvas = canvasRef.current;
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

  // Handle mouse events
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

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const pressure = (e as any).pressure || 1;
        ctx.strokeStyle = isEraserEnabled ? "black" : selectedColor;
        ctx.lineWidth = ((isEraserEnabled ? 20 : 5) * viewport.zoom) * pressure;
        ctx.beginPath();
        const point = transformPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY, viewport);
        ctx.moveTo(point.x, point.y);
        setIsDrawing(true);
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
    
    const point = transformPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY, viewport);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    
    ctx.restore();
    
    // Update minimap with new drawing
    updateMinimap(true);
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

  // Panning functions
  const startPanning = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPanning(true);
    setLastPanPoint({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  };

  const handlePanning = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning && lastPanPoint) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      
      setViewport(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      
      updateCanvas(true);
    }
  };

  const stopPanning = () => {
    setIsPanning(false);
    setLastPanPoint(null);
  };

  // Zoom functions
  const handleZoom = (zoomIn: boolean) => {
    setViewport(prev => {
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, 
        prev.zoom + (zoomIn ? ZOOM_SPEED : -ZOOM_SPEED)));
      return {
        ...prev,
        zoom: newZoom
      };
    });
    
    requestAnimationFrame(() => updateCanvas(true));
  };

  const zoomToPoint = (newZoom: number, x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get the mouse position relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = x - rect.left;
    const mouseY = y - rect.top;
    
    // Calculate world coordinates before zoom
    const worldX = (mouseX - viewport.x) / viewport.zoom;
    const worldY = (mouseY - viewport.y) / viewport.zoom;
    
    // Calculate new viewport position to keep the point under mouse
    const newX = mouseX - worldX * newZoom;
    const newY = mouseY - worldY * newZoom;
    
    setViewport({
      x: newX,
      y: newY,
      zoom: newZoom
    });
    
    requestAnimationFrame(() => updateCanvas(true));
  };

  const resetZoom = () => {
    setViewport(DEFAULT_VIEWPORT);
    requestAnimationFrame(() => updateCanvas(true));
  };

  const centerCanvas = () => {
    setViewport(prev => ({
      ...prev,
      x: centerPoint.x - (window.innerWidth / 2) * prev.zoom,
      y: centerPoint.y - (window.innerHeight / 2) * prev.zoom
    }));
    updateCanvas();
  };

  // History management
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
    if (canvas) {
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        if (ctx) {
          ctx.fillStyle = "black";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        }
      };
      img.src = imageData;
    }
  };

  // Event handlers
  const handleWheel = (e: WheelEvent<HTMLCanvasElement>) => {
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

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !isSpacePressed) {
      e.preventDefault();
      setIsSpacePressed(true);
      previousToolRef.current = tool;
      setTool('hand');
    }

    // Additional keyboard shortcuts
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
      }
    }

    // Navigation with arrow keys
    if (tool === 'hand' || isSpacePressed) {
      switch (e.code) {
        case 'ArrowLeft':
          panBy(-50 * PAN_SENSITIVITY, 0);
          break;
        case 'ArrowRight':
          panBy(50 * PAN_SENSITIVITY, 0);
          break;
        case 'ArrowUp':
          panBy(0, -50 * PAN_SENSITIVITY);
          break;
        case 'ArrowDown':
          panBy(0, 50 * PAN_SENSITIVITY);
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
    if (typeof window !== 'undefined') {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");

        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        
        if (tempCtx && ctx) {
          tempCtx.drawImage(canvas, 0, 0);
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          
          setCanvasDimensions({
            width: window.innerWidth,
            height: window.innerHeight
          });
          
          ctx.fillStyle = "black";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(tempCanvas, 0, 0);
          ctx.lineCap = "round";
          ctx.lineWidth = isEraserEnabled ? 20 : 5;
          
          updateMinimap();
        }
      }
    }
  };

  // Tool management
  const toggleHandTool = () => {
    if (tool !== 'hand') {
      previousToolRef.current = tool;
      setTool('hand');
    } else {
      setTool(previousToolRef.current);
    }
  };

  // Canvas operations
  const resetCanvas = () => {
    // Reset viewport to default
    setViewport(DEFAULT_VIEWPORT);
    
    // Reset drawing history
    setDrawingHistory(null);
    
    // Reset all other states
    setResult(null);
    setError(null);
    setLatexExpression([]);
    setVariable({});
    setIsDrawing(false);
    setIsErasing(false);
    setIsEraserEnabled(false);
    setTool('draw');
    setIsPanning(false);
    setLastPanPoint(null);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Clear the entire canvas
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the default grid
        drawGrid(ctx, viewport, gridSize);
        
        // Reset the history
        const resetState = canvas.toDataURL();
        setHistory([resetState]);
        setCurrentStep(0);
        
        // Update the minimap
        updateMinimap();
      }
    }
  };

  const panBy = (dx: number, dy: number) => {
    setViewport(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy
    }));
    
    requestAnimationFrame(() => updateCanvas(true));
  };

  // LaTeX handling
  const handleLatexDrag = (index: number, e: any, ui: any) => {
    setLatexPosition({
      x: ui.x,
      y: ui.y,
    });
  };

  const handleErase = (index: number) => {
    if (isErasing) {
      setLatexExpression(latexExpression.filter((_, i) => i !== index));
    }
  };

  // API integration
  const sendData = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsLoading(true);
      setError(null);

      const imageData = canvas.toDataURL("image/png");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error analyzing image:", err);
    } finally {
      setIsLoading(false);
    }
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
  
  return {
    // Refs
    canvasRef,
    minimapRef,
    gridCanvasRef,
    drawingCanvasRef,
    tempCanvasRef,
    
    // State
    canvasDimensions,
    selectedColor,
    reset,
    result,
    variable,
    isLoading,
    error,
    latexPosition,
    latexExpression,
    isEraserEnabled,
    history,
    currentStep,
    viewport,
    showMinimap,
    tool,
    
    // Methods
    setSelectedColor,
    setReset,
    setIsEraserEnabled,
    toggleHandTool,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleLatexDrag,
    handleErase,
    sendData,
    resetCanvas,
    undo,
    redo,
    handleZoom,
    centerCanvas,
    setShowMinimap,
    getCursor,
    setTool
  };
}