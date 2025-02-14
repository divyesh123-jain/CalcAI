/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// "use client";
// import React, { useEffect, useRef, useState , KeyboardEvent, WheelEvent } from "react";
// import CanvasContainer from "../CanvasContainer";
// import axios from "axios";
// import { Button } from "../ui/button";
// import Draggable from "react-draggable";
// import { Eraser, Undo, Redo, RotateCcw , ZoomIn ,  ZoomOut , MousePointer , Hand , Home , Maximize } from "lucide-react";

// declare global {
//   interface Window {
//     MathJax: any;
//   }
// }

// interface Point {
//   x: number;
//   y: number;
// }

// interface ViewPort {
//   x: number;
//   y: number;
//   zoom: number;
// }


// interface Response {
//   expr: string;
//   result: string;
//   assign: boolean;
// }

// interface GeneratedResult {
//   expression: string;
//   answer: string;
// }

// interface CanvasDimensions {
//   width: number;
//   height: number;
// }

// interface CanvasLayers {
//   grid: HTMLCanvasElement | null;
//   drawing: HTMLCanvasElement | null;
//   temp: HTMLCanvasElement | null;
// }

// const ZOOM_SENSITIVITY = 0.001;
// const PAN_SENSITIVITY = 1.2;
// const MIN_ZOOM = 0.1;
// const MAX_ZOOM = 5;
// const ZOOM_SPEED = 0.1;


// export default function Dashboard() {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const minimapRef = useRef<HTMLCanvasElement>(null);
//   const gridCanvasRef = useRef<HTMLCanvasElement>(null);
//   const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
//   const tempCanvasRef = useRef<HTMLCanvasElement>(null);
//   const [canvasDimensions, setCanvasDimensions] = useState<CanvasDimensions>({
//     width: window.innerWidth,
//     height: window.innerHeight
//   });
//   const [isDrawing, setIsDrawing] = useState(false);
//   const [selectedColor, setSelectedColor] = useState("tomato");
//   const [reset, setReset] = useState(false);
//   const [result, setResult] = useState<GeneratedResult | null>(null);
//   const [variable, setVariable] = useState({});
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });
//   const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
//   const [isErasing, setIsErasing] = useState(false);
//   const [draggingLatex, setDraggingLatex] = useState<string | null>(null);
//   const [isEraserEnabled, setIsEraserEnabled] = useState(false);
//   const [history, setHistory] = useState<string[]>([]);
//   const [currentStep, setCurrentStep] = useState(-1);
//   const [viewport, setViewport] = useState<ViewPort>({ x: 0, y: 0, zoom: 1 });
//   const [lastPanPoint, setLastPanPoint] = useState<Point | null>(null);
//   const [isPanning, setIsPanning] = useState(false);
//   const [isHandTool, setIsHandTool] = useState(false);
//   const [isSpacePressed, setIsSpacePressed] = useState(false);
//   const [tool, setTool] = useState<'draw' | 'hand' | 'eraser'>('draw');

//   const previousToolRef = useRef<'draw' | 'hand' | 'eraser'>('draw');
//   const [centerPoint, setCenterPoint] = useState<Point>({ x: 0, y: 0 });
//   const [gridSize, setGridSize] = useState(20);
//   const [showMinimap, setShowMinimap] = useState(true);
  

//   useEffect(() => {
//     const script = document.createElement("script");
//     script.src = "https://polyfill.io/v3/polyfill.min.js?features=es6";
//     script.async = true;

//     const mathjaxScript = document.createElement("script");
//     mathjaxScript.src =
//       "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
//     mathjaxScript.async = true;

//     document.head.appendChild(script);
//     document.head.appendChild(mathjaxScript);

//     return () => {
//       document.head.removeChild(script);
//       document.head.removeChild(mathjaxScript);
//     };
//   }, []);

//   useEffect(() => {
//     if (latexExpression.length > 0) {
//       window.MathJax?.typesetPromise?.();
//     }
//   }, [latexExpression]);

//   useEffect(() => {
//     if (reset) {
//       resetCanvas();
//       setLatexExpression([]);
//       setResult(null);
//       setVariable({});
//       setReset(false);
//     }
//   }, [reset]);

//   useEffect(() => {
//     initializeCanvas();
//     window.addEventListener("resize", handleResize);
//     window.addEventListener("keydown", handleKeyDown as unknown as EventListener);
//     window.addEventListener("keyup", handleKeyUp as unknown as EventListener);
    
//     // Set initial center point
//     setCenterPoint({
//       x: window.innerWidth / 2,
//       y: window.innerHeight / 2
//     });
    
//     return () => {
//       window.removeEventListener("resize", handleResize);
//       window.removeEventListener("keydown", handleKeyDown as unknown as EventListener);
//       window.removeEventListener("keyup", handleKeyUp as unknown as EventListener);
//     };
//   }, []);

//   useEffect(() => {
//     if (minimapRef.current) {
//       const minimapCtx = minimapRef.current.getContext('2d');
//       if (minimapCtx) {
//         minimapCtx.fillStyle = 'black';
//         minimapCtx.fillRect(0, 0, minimapRef.current.width, minimapRef.current.height);
//       }
//     }
//   }, []);

//   const handleKeyDown = (e: KeyboardEvent) => {
//     if (e.code === 'Space' && !isSpacePressed) {
//       e.preventDefault();
//       setIsSpacePressed(true);
//       previousToolRef.current = tool;
//       setTool('hand');
//     }

//     // Additional keyboard shortcuts
//     if (e.ctrlKey || e.metaKey) {
//       switch (e.code) {
//         case 'Equal':
//         case 'NumpadAdd':
//           e.preventDefault();
//           handleZoom(true);
//           break;
//         case 'Minus':
//         case 'NumpadSubtract':
//           e.preventDefault();
//           handleZoom(false);
//           break;
//         case 'Digit0':
//           e.preventDefault();
//           resetZoom();
//           break;
//       }
//     }

//     // Navigation with arrow keys
//     if (tool === 'hand' || isSpacePressed) {
//       switch (e.code) {
//         case 'ArrowLeft':
//           panBy(-50 * PAN_SENSITIVITY, 0);
//           break;
//         case 'ArrowRight':
//           panBy(50 * PAN_SENSITIVITY, 0);
//           break;
//         case 'ArrowUp':
//           panBy(0, -50 * PAN_SENSITIVITY);
//           break;
//         case 'ArrowDown':
//           panBy(0, 50 * PAN_SENSITIVITY);
//           break;
//       }
//     }
//   };

//   const handleWheel = (e: WheelEvent<HTMLCanvasElement>) => {
//     e.preventDefault();
    
//     if (e.ctrlKey || e.metaKey) {
//       // Zoom
//       const delta = -e.deltaY * ZOOM_SENSITIVITY;
//       const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, viewport.zoom * (1 + delta)));
//       const mouseX = e.nativeEvent.offsetX;
//       const mouseY = e.nativeEvent.offsetY;
      
//       zoomToPoint(newZoom, mouseX, mouseY);
//     } else {
//       // Pan
//       panBy(-e.deltaX * PAN_SENSITIVITY, -e.deltaY * PAN_SENSITIVITY);
//     }
//   };

//   const zoomToPoint = (newZoom: number, x: number, y: number) => {
//     const oldZoom = viewport.zoom;
//     const zoomPoint = transformPoint(x, y);
    
//     setViewport(prev => ({
//       x: prev.x - (zoomPoint.x * (newZoom - oldZoom)),
//       y: prev.y - (zoomPoint.y * (newZoom - oldZoom)),
//       zoom: newZoom
//     }));
    
//     updateCanvas();
//   };

//   const panBy = (dx: number, dy: number) => {
//     setViewport(prev => ({
//       ...prev,
//       x: prev.x + dx,
//       y: prev.y + dy
//     }));
    
//     updateCanvas();
//   };

//   const resetZoom = () => {
//     setViewport({ x: 0, y: 0, zoom: 1 });
//     updateCanvas();
//   };

//   const handleKeyUp = (e: KeyboardEvent) => {
//     if (e.code === 'Space') {
//       setIsSpacePressed(false);
//       setTool(previousToolRef.current);
//     }
//   };

//   const centerCanvas = () => {
//     setViewport(prev => ({
//       ...prev,
//       x: centerPoint.x - (window.innerWidth / 2) * prev.zoom,
//       y: centerPoint.y - (window.innerHeight / 2) * prev.zoom
//     }));
//     updateCanvas();
//   };

//   const updateCanvas = () => {
//     const canvas = canvasRef.current;
//     if (canvas) {
//       const ctx = canvas.getContext("2d");
//       if (ctx) {
//         drawGrid(ctx);
//       }
//     }
//   };

//   const toggleHandTool = () => {
//     if (tool !== 'hand') {
//       previousToolRef.current = tool;
//       setTool('hand');
//     } else {
//       setTool(previousToolRef.current);
//     }
//   };

//   const initializeCanvas = () => {
//     const canvas = canvasRef.current;
//     if (canvas) {
//       const ctx = canvas.getContext("2d");
//       if (ctx) {
//         canvas.width = window.innerWidth;
//         canvas.height = window.innerHeight;
        
//         ctx.fillStyle = "black";
//         ctx.fillRect(0, 0, canvas.width, canvas.height);
        
//         drawGrid(ctx);
        
//         const initialState = canvas.toDataURL();
//         setHistory([initialState]);
//         setCurrentStep(0);
//       }
//     }
//   };

//   const drawGrid = (ctx: CanvasRenderingContext2D) => {
//     const { x, y, zoom } = viewport;
    
//     ctx.fillStyle = "black";
//     ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
//     const dotSpacing = 20 * zoom;
//     const offsetX = x % dotSpacing;
//     const offsetY = y % dotSpacing;
    
//     ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    
//     for (let i = offsetX; i < ctx.canvas.width; i += dotSpacing) {
//       for (let j = offsetY; j < ctx.canvas.height; j += dotSpacing) {
//         ctx.beginPath();
//         ctx.arc(i, j, 1 * zoom, 0, Math.PI * 2);
//         ctx.fill();
//       }
//     }
//     updateMinimap();
//   };

//   const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
//     if (tool === 'hand' || e.buttons === 2 || (e.buttons === 1 && e.altKey)) {
//       startPanning(e);
//     } else if (tool === 'draw' && e.buttons === 1) {
//       startDrawing(e);
//     } else if (tool === 'eraser' && e.buttons === 1) {
//       startErasing(e);
//     }
//   };

//   const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
//     if (isPanning) {
//       handlePanning(e);
//     } else if (isDrawing) {
//       draw(e);
//     }
//   };

//   const handleMouseUp = () => {
//     if (isPanning) {
//       stopPanning();
//     }
//     if (isDrawing) {
//       stopDrawing();
//     }
//   };


//   const startPanning = (e: React.MouseEvent<HTMLCanvasElement>) => {
//     setIsPanning(true);
//     setLastPanPoint({ x: e.clientX, y: e.clientY });
//     e.preventDefault();
//   };

//   const handlePanning = (e: React.MouseEvent<HTMLCanvasElement>) => {
//     if (isPanning && lastPanPoint) {
//       const dx = e.clientX - lastPanPoint.x;
//       const dy = e.clientY - lastPanPoint.y;
      
//       setViewport(prev => ({
//         ...prev,
//         x: prev.x + dx,
//         y: prev.y + dy
//       }));
      
//       setLastPanPoint({ x: e.clientX, y: e.clientY });
      
//       const canvas = canvasRef.current;
//       if (canvas) {
//         const ctx = canvas.getContext("2d");
//         if (ctx) {
//           drawGrid(ctx);
//         }
//       }
//     }
//   };

//   const updateMinimap = () => {
//     const mainCanvas = canvasRef.current;
//     const minimapCanvas = minimapRef.current;
    
//     if (mainCanvas && minimapCanvas) {
//       const minimapCtx = minimapCanvas.getContext('2d');
//       const mainCtx = mainCanvas.getContext('2d');
      
//       if (minimapCtx && mainCtx) {
//         // Set minimap dimensions
//         minimapCanvas.width = 192; // 48 * 4 (w-48 in Tailwind)
//         minimapCanvas.height = 192;
        
//         // Clear minimap
//         minimapCtx.fillStyle = 'black';
//         minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
        
//         // Draw scaled version of main canvas
//         minimapCtx.drawImage(
//           mainCanvas,
//           0,
//           0,
//           mainCanvas.width,
//           mainCanvas.height,
//           0,
//           0,
//           minimapCanvas.width,
//           minimapCanvas.height
//         );
//       }
//     }
//   };


//   const stopPanning = () => {
//     setIsPanning(false);
//     setLastPanPoint(null);
//     stopDrawing();
//   };

//   const handleZoom = (zoomIn: boolean) => {
//     setViewport(prev => ({
//       ...prev,
//       zoom: Math.max(0.5, Math.min(3, prev.zoom + (zoomIn ? 0.1 : -0.1)))
//     }));
    
//     const canvas = canvasRef.current;
//     if (canvas) {
//       const ctx = canvas.getContext("2d");
//       if (ctx) {
//         drawGrid(ctx);
//       }
//     }
//   };



//   const handleResize = () => {
//     const canvas = canvasRef.current;
//     if (canvas) {
//       const ctx = canvas.getContext("2d");
//       const tempCanvas = document.createElement("canvas");
//       const tempCtx = tempCanvas.getContext("2d");

//       tempCanvas.width = canvas.width;
//       tempCanvas.height = canvas.height;
      
//       if (tempCtx && ctx) {
//         tempCtx.drawImage(canvas, 0, 0);
//         canvas.width = window.innerWidth;
//         canvas.height = window.innerHeight;
        
//         setCanvasDimensions({
//           width: window.innerWidth,
//           height: window.innerHeight
//         });
        
//         ctx.fillStyle = "black";
//         ctx.fillRect(0, 0, canvas.width, canvas.height);
//         ctx.drawImage(tempCanvas, 0, 0);
//         ctx.lineCap = "round";
//         ctx.lineWidth = isEraserEnabled ? 20 : 5;
        
//         updateMinimap();
//       }
//     }
//   };

//   const saveToHistory = (imageData: string) => {
//     const newHistory = history.slice(0, currentStep + 1);
//     newHistory.push(imageData);
//     setHistory(newHistory);
//     setCurrentStep(newHistory.length - 1);
//   };

//   const undo = () => {
//     if (currentStep > 0) {
//       setCurrentStep(currentStep - 1);
//       restoreCanvasState(history[currentStep - 1]);
//     }
//   };

//   const redo = () => {
//     if (currentStep < history.length - 1) {
//       setCurrentStep(currentStep + 1);
//       restoreCanvasState(history[currentStep + 1]);
//     }
//   };

//   const restoreCanvasState = (imageData: string) => {
//     const canvas = canvasRef.current;
//     if (canvas) {
//       const ctx = canvas.getContext("2d");
//       const img = new Image();
//       img.onload = () => {
//         if (ctx) {
//           ctx.fillStyle = "black";
//           ctx.fillRect(0, 0, canvas.width, canvas.height);
//           ctx.drawImage(img, 0, 0);
//         }
//       };
//       img.src = imageData;
//     }
//   };

//   const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
//     const canvas = canvasRef.current;
//     if (canvas) {
//       const ctx = canvas.getContext("2d");
//       if (ctx) {
//         const pressure = (e as any).pressure || 1;
//         ctx.strokeStyle = isEraserEnabled ? "black" : selectedColor;
//         ctx.lineWidth = ((isEraserEnabled ? 20 : 5) * viewport.zoom) * pressure;
//         ctx.beginPath();
//         const point = transformPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
//         ctx.moveTo(point.x, point.y);
//         setIsDrawing(true);
//       }
//     }
//   };


//   const renderMinimap = () => {
//     if (!showMinimap) return null;

//     // const mainCanvas = canvasRef.current;
    
//     return (
//       <div className="absolute bottom-4 left-4 w-48 h-48 bg-black/50 border border-white/20 rounded-lg overflow-hidden">
//         <canvas
//           ref={minimapRef}
//           className="w-full h-full"
//           style={{ opacity: 0.7 }}
//         />
//         <div
//           className="absolute border-2 border-blue-500/50"
//           style={{
//             left: `${(-viewport.x / (canvasDimensions.width || 1)) * 100}%`,
//             top: `${(-viewport.y / (canvasDimensions.height || 1)) * 100}%`,
//             width: `${(window.innerWidth / (canvasDimensions.width || 1)) * 100}%`,
//             height: `${(window.innerHeight / (canvasDimensions.height || 1)) * 100}%`,
//           }}
//         />
//       </div>
//     );
//   };



//   const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
//     if (!isDrawing) return;
//     const canvas = canvasRef.current;
//     if (canvas) {
//       const ctx = canvas.getContext("2d");
//       if (ctx) {
//         const point = transformPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
//         ctx.lineTo(point.x, point.y);
//         ctx.stroke();
//       }
//     }
//   };

//   const transformPoint = (x: number, y: number): Point => {
//     return {
//       x: (x - viewport.x) / viewport.zoom,
//       y: (y - viewport.y) / viewport.zoom
//     };
//   };

//   const stopDrawing = () => {
//     if (isDrawing) {
//       setIsDrawing(false);
//       const canvas = canvasRef.current;
//       if (canvas) {
//         const imageData = canvas.toDataURL();
//         saveToHistory(imageData);
//       }
//     }
//   };

//   const resetCanvas = () => {
//     const canvas = canvasRef.current;
//     if (canvas) {
//       const ctx = canvas.getContext("2d");
//       if (ctx) {
//         ctx.fillStyle = "black";
//         ctx.fillRect(0, 0, canvas.width, canvas.height);
        
//         // Save the reset state to history
//         const resetState = canvas.toDataURL();
//         setHistory([resetState]);
//         setCurrentStep(0);
//       }
//     }
//     setResult(null);
//     setError(null);
//   };

//   const sendData = async () => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     try {
//       setIsLoading(true);
//       setError(null);

//       const imageData = canvas.toDataURL("image/png");
//       const response = await axios({
//         method: "POST",
//         url: "http://localhost:3000/api/calculate",
//         data: {
//           image: imageData,
//           variable: variable,
//         },
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });

//       const generatedResult: GeneratedResult = response.data;
//       setResult(generatedResult);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "An error occurred");
//       console.error("Error analyzing image:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleLatexDrag = (index: number, e: any, ui: any) => {
//     setLatexPosition({
//       x: ui.x,
//       y: ui.y,
//     });
//   };

//   const handleErase = (index: number) => {
//     if (isErasing) {
//       setLatexExpression(latexExpression.filter((_, i) => i !== index));
//     }
//   };

//   const getCursor = () => {
//     switch (tool) {
//       case 'hand':
//         return isPanning ? 'grabbing' : 'grab';
//       case 'eraser':
//         return "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"white\" stroke=\"white\" stroke-width=\"2\"><path d=\"M19 19H5L17 7l2 2z\"/></svg>') 0 24, auto";
//       default:
//         return 'default';
//     }
//   };

//   return (
//     <div className="relative w-full h-screen bg-black overflow-hidden">
//       <CanvasContainer setColor={setSelectedColor} selectedColor={selectedColor} />
      
//       {/* Top toolbar */}
//       <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center shadow-indigo-500/50 shadow-2xl gap-4 p-4 rounded-xl backdrop-blur-md z-10">
//         <Button 
//           onClick={sendData} 
//           disabled={isLoading}
//           className="flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50  transition-all"
//         >
    
//           {isLoading ? "Calculating..." : "Calculate"}
//         </Button>
        
//         <Button 
//           onClick={() => setReset(true)}
//           disabled={isLoading}
//           className="flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50  transition-all"
//         >
//           <RotateCcw className="w-4 h-4" />
//           Reset
//         </Button>

//         <Button 
//           onClick={centerCanvas}
//           className="flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50 transition-all"
//           title="Center Canvas (Home)"
//         >
//           <Home className="w-4 h-4" />
//         </Button>
        
//         <Button 
//           onClick={() => setShowMinimap(!showMinimap)}
//           className="flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50 transition-all"
//           title="Toggle Minimap (M)"
//         >
//           <Maximize className="w-4 h-4" />
//         </Button>
        
//         <Button 
//           onClick={undo}
//           disabled={currentStep <= 0}
//           className="flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50  transition-all"
//         >
//           <Undo className="w-4 h-4" />
//           Undo
//         </Button>
        
//         <Button 
//           onClick={redo}
//           disabled={currentStep >= history.length - 1}
//           className="flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50  transition-all"
//         >
//           <Redo className="w-4 h-4" />
//           Redo
//         </Button>
        
//         <Button
//           onClick={() => setIsEraserEnabled(!isEraserEnabled)}
//           className={`flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50  transition-all ${
//             isEraserEnabled ? 'bg-blue-600 hover:bg-blue-700' : ''
//           }`}
//         >
//           <Eraser className="w-4 h-4" />
//           {isEraserEnabled ? 'Eraser' : 'Eraser'}
//         </Button>

//         <Button 
//           onClick={() => setTool('draw')}
//           className={`flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50 transition-all ${
//             tool === 'draw' ? 'bg-blue-600' : ''
//           }`}
//         >
//           <MousePointer className="w-4 h-4" />
//         </Button>
        
//         <Button 
//           onClick={toggleHandTool}
//           className={`flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50 transition-all ${
//             tool === 'hand' ? 'bg-blue-600' : ''
//           }`}
//         >
//           <Hand className="w-4 h-4" />
//         </Button>
        

//         <Button 
//           onClick={() => handleZoom(true)}
//           className="flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50 transition-all"
//         >
//           <ZoomIn className="w-4 h-4" />
//         </Button>
        
//         <Button 
//           onClick={() => handleZoom(false)}
//           className="flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50 transition-all"
//         >
//           <ZoomOut className="w-4 h-4" />
//         </Button>
//       </div>

//       <canvas
//         ref={canvasRef}
//         className="absolute top-0 left-0 w-full h-full"
//         onMouseDown={handleMouseDown}
//         onMouseMove={handleMouseMove}
//         onMouseUp={handleMouseUp}
//         onMouseOut={handleMouseUp}
//         onWheel={handleWheel}
//         onContextMenu={(e) => e.preventDefault()}
//         style={{ cursor: getCursor() }}
//       />

//       {renderMinimap()}


//       <div className="absolute bottom-4 right-4 text-white/50 text-sm space-y-1">
//         <div>
//           <kbd className="px-2 py-1 bg-white/10 rounded">Space</kbd> Hand tool
//         </div>
//         <div>
//           <kbd className="px-2 py-1 bg-white/10 rounded">Ctrl</kbd> + Scroll to zoom
//         </div>
//         <div>
//           <kbd className="px-2 py-1 bg-white/10 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-white/10 rounded">0</kbd> Reset zoom
//         </div>
//         <div>
//           <kbd className="px-2 py-1 bg-white/10 rounded">Home</kbd> Center canvas
//         </div>
//       </div>
  

//       {/* LaTeX expressions */}
//       {latexExpression.map((latex, index) => (
//         <Draggable
//           key={index}
//           defaultPosition={{ x: latexPosition.x, y: latexPosition.y }}
//           onStop={(e, data) => handleLatexDrag(index, e, data)}
//         >
//           <div
//             className="absolute p-2 text-white rounded shadow-md"
//             onClick={() => handleErase(index)}
//           >
//             <div
//               className="latex-content"
//               dangerouslySetInnerHTML={{
//                 __html: `\\(${latex}\\)`,
//               }}
//             />
//           </div>
//         </Draggable>
//       ))}

//       {/* Results display */}
//       {result && (
//         <div className="absolute top-24 right-4 bg-white/10 p-4 rounded-lg backdrop-blur-sm text-white shadow-lg">
//           <p>Expression: {result.expression}</p>
//           <p>Answer: {result.answer}</p>
//         </div>
//       )}

//       {/* Error display */}
//       {error && (
//         <div className="absolute top-24 right-4 bg-red-500/10 p-4 rounded-lg backdrop-blur-sm text-red-400 shadow-lg">
//           {error}
//         </div>
//       )}
//     </div>
//   );
// }

"use client";
import React, { useEffect, useRef, useState } from "react";
import CanvasContainer from "../CanvasContainer";
import axios from "axios";
import { Button } from "../ui/button";
import Draggable from "react-draggable";
import { Eraser, Undo, Redo, RotateCcw } from "lucide-react";

declare global {
  interface Window {
    MathJax: unknown;
  }
}

interface Response {
  expr: string;
  result: string;
  assign: boolean;
}

interface GeneratedResult {
  expression: string;
  answer: string;
}

export default function Dashboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  const [draggingLatex, setDraggingLatex] = useState<string | null>(null);
  const [isEraserEnabled, setIsEraserEnabled] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://polyfill.io/v3/polyfill.min.js?features=es6";
    script.async = true;

    const mathjaxScript = document.createElement("script");
    mathjaxScript.src =
      "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
    mathjaxScript.async = true;

    document.head.appendChild(script);
    document.head.appendChild(mathjaxScript);

    return () => {
      document.head.removeChild(script);
      document.head.removeChild(mathjaxScript);
    };
  }, []);

  useEffect(() => {
    if (latexExpression.length > 0) {
      (window.MathJax as any)?.typesetPromise?.();
    }
  }, [latexExpression]);

  useEffect(() => {
    if (reset) {
      resetCanvas();
      setLatexExpression([]);
      setResult(null);
      setVariable({});
      setReset(false);
    }
  }, [reset]);

  useEffect(() => {
    initializeCanvas();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = "round";
        ctx.lineWidth = 5;

        // Save initial state to history
        const initialState = canvas.toDataURL();
        setHistory([initialState]);
        setCurrentStep(0);
      }
    }
  };

  const handleResize = () => {
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
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.lineCap = "round";
        ctx.lineWidth = isEraserEnabled ? 20 : 5;
      }
    }
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

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = isEraserEnabled ? "black" : selectedColor;
        ctx.lineWidth = isEraserEnabled ? 20 : 5;
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setIsDrawing(true);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        const imageData = canvas.toDataURL();
        saveToHistory(imageData);
      }
    }
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Save the reset state to history
        const resetState = canvas.toDataURL();
        setHistory([resetState]);
        setCurrentStep(0);
      }
    }
    setResult(null);
    setError(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error analyzing image:", err);
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="relative w-full h-screen bg-black">
      <CanvasContainer setColor={setSelectedColor} selectedColor={selectedColor} />
      
      {/* Top toolbar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center shadow-indigo-500/50 shadow-2xl gap-4 p-4 rounded-xl backdrop-blur-md z-10">
        <Button 
          onClick={sendData} 
          disabled={isLoading}
          className="flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50  transition-all"
        >
    
          {isLoading ? "Calculating..." : "Calculate"}
        </Button>
        
        <Button 
          onClick={() => setReset(true)}
          disabled={isLoading}
          className="flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50  transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
        
        <Button 
          onClick={undo}
          disabled={currentStep <= 0}
          className="flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50  transition-all"
        >
          <Undo className="w-4 h-4" />
          Undo
        </Button>
        
        <Button 
          onClick={redo}
          disabled={currentStep >= history.length - 1}
          className="flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50  transition-all"
        >
          <Redo className="w-4 h-4" />
          Redo
        </Button>
        
        <Button
          onClick={() => setIsEraserEnabled(!isEraserEnabled)}
          className={`flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50  transition-all ${
            isEraserEnabled ? 'bg-blue-600 hover:bg-blue-700' : ''
          }`}
        >
          <Eraser className="w-4 h-4" />
          {isEraserEnabled ? 'Drawing' : 'Eraser'}
        </Button>
      </div>

      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        style={{ 
          cursor: isEraserEnabled 
            ? "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"white\" stroke=\"white\" stroke-width=\"2\"><path d=\"M19 19H5L17 7l2 2z\"/></svg>') 0 24, auto"
            : 'default'
        }}
      />

      {/* LaTeX expressions */}
      {latexExpression.map((latex, index) => (
        <Draggable
          key={index}
          defaultPosition={{ x: latexPosition.x, y: latexPosition.y }}
          onStop={(e, data) => handleLatexDrag(index, e, data)}
        >
          <div
            className="absolute p-2 text-white rounded shadow-md"
            onClick={() => handleErase(index)}
          >
            <div
              className="latex-content"
              dangerouslySetInnerHTML={{
                __html: `\\(${latex}\\)`,
              }}
            />
          </div>
        </Draggable>
      ))}

      {/* Results display */}
      {result && (
        <div className="absolute top-24 right-4 bg-white/10 p-4 rounded-lg backdrop-blur-sm text-white shadow-lg">
          <p>Expression: {result.expression}</p>
          <p>Answer: {result.answer}</p>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="absolute top-24 right-4 bg-red-500/10 p-4 rounded-lg backdrop-blur-sm text-red-400 shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}