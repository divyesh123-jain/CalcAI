/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";
import React, { useEffect, useState} from "react";
import Canvas from "../canvas/Canvas";
import Toolbar from "../ToolBar";
import Minimap from "../Minimap";
import ResultsDisplay from "../ResultDisplay";
import KeyboardShortcuts from "../KeyboardShortcuts";
import ColorPicker from "../ColorPicker";
import CanvasSettings from "../CanvasSettings";
import { TextPanel } from "../TextPanel";
import { TextEditor } from "../TextEditor";
import { TextRenderer } from "../TextRenderer";
import { DrawingRenderer } from "../DrawingRenderer";
import { DrawingCanvas } from "../DrawingCanvas";
import { useTextManager } from "../../hooks/useTextManager";
import { useDrawingManager } from "../../hooks/useDrawingManager";
import { useDashboard } from "./useDashboard";
import { BrushType } from "../../lib/types";

declare global {
  interface Window {
    MathJax: any;
  }
}

export default function DashboardComponent() {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const [showCanvasSettings, setShowCanvasSettings] = useState(false);
  
  // Text functionality
  const textManager = useTextManager();
  
  // Drawing element functionality
  const drawingManager = useDrawingManager();
  
  const {
    // Actually used refs and state
    canvasRef,
    canvasDimensions,
    selectedColor,
    result,
    isLoading,
    latexExpression,
    isEraserEnabled,
    history,
    currentStep,
    viewport,
    tool,
    brushType,
    showMinimap,
    canvasBackgroundColor,

    // Actually used setters
    setSelectedColor,
    setTool,
    setShowMinimap,
    setBrushType,
    setViewport,
    setCanvasBackgroundColor,
    
    // Actually used methods
    sendData,
    resetCanvas,
    undo,
    redo,
    toggleEraser,
    handleZoom,
    centerCanvas,
    toggleHandTool,
    
    // Mouse handlers for canvas
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseOut,
    handleWheel,
    handleContextMenu,
    getCursor,
  } = useDashboard();

  useEffect(() => {
    // Load MathJax
    const script = document.createElement("script");
    script.src = "https://polyfill.io/v3/polyfill.min.js?features=es6";
    script.async = true;

    const mathjaxScript = document.createElement("script");
    mathjaxScript.src =
      "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mtml-chtml.js";
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
      window.MathJax?.typesetPromise?.();
    }
  }, [latexExpression]);

  // Auto-show text panel when text tool is selected
  useEffect(() => {
    if (tool === 'text') {
      textManager.setTextPanelVisible(true);
    } else {
      textManager.setTextPanelVisible(false);
    }
  }, [tool]);

  // Keyboard event handler for delete key and new shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Handle delete for text elements
      if ((e.key === 'Delete' || e.key === 'Backspace') && 
          !textManager.editingTextId && 
          textManager.selectedTextId &&
          tool === 'text') {
        e.preventDefault();
        textManager.deleteSelectedText();
      }
      
      // Handle delete for drawing elements
      if ((e.key === 'Delete' || e.key === 'Backspace') && 
          drawingManager.selectedDrawingId &&
          tool === 'select') {
        e.preventDefault();
        drawingManager.deleteSelectedDrawing();
      }
      
      // Select All (Ctrl+A)
      if (e.key === 'a' && (e.ctrlKey || e.metaKey) && tool === 'select') {
        e.preventDefault();
        if (drawingManager.isAllSelected) {
          drawingManager.deselectAll();
        } else {
          drawingManager.selectAllDrawings();
        }
      }
      
      // Move Mode (M key)
      if (e.key === 'm' && !e.ctrlKey && !e.metaKey && tool === 'select') {
        e.preventDefault();
        drawingManager.setMoveMode(!drawingManager.isMoveMode);
      }
      
      // 🎉 MAGIC KEYBOARD SHORTCUTS! 🎉
      if (tool === 'select') {
        // Duplicate (Ctrl+D)
        if (e.key === 'd' && (e.ctrlKey || e.metaKey) && drawingManager.selectedDrawingId) {
          e.preventDefault();
          drawingManager.duplicateSelected();
        }
        
        // Flip Horizontal (Ctrl+H)
        if (e.key === 'h' && (e.ctrlKey || e.metaKey) && drawingManager.selectedDrawingId) {
          e.preventDefault();
          drawingManager.flipSelected('horizontal');
        }
        
        // Flip Vertical (Ctrl+V)
        if (e.key === 'v' && (e.ctrlKey || e.metaKey) && drawingManager.selectedDrawingId) {
          e.preventDefault();
          drawingManager.flipSelected('vertical');
        }
        
        // Magic Organize (Ctrl+Shift+O)
        if (e.key === 'o' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
          e.preventDefault();
          drawingManager.magicOrganize();
        }
        
        // Auto Group (Ctrl+G)
        if (e.key === 'g' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          drawingManager.autoGroup();
        }
        
        // Smooth Strokes (Ctrl+Shift+S)
        if (e.key === 's' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
          e.preventDefault();
          drawingManager.smoothStrokes();
        }
        
        // Scale Up (Ctrl++ or Ctrl+=)
        if ((e.key === '+' || e.key === '=') && (e.ctrlKey || e.metaKey) && drawingManager.selectedDrawingId) {
          e.preventDefault();
          drawingManager.scaleSelected(1.2);
        }
        
        // Scale Down (Ctrl+-)
        if (e.key === '-' && (e.ctrlKey || e.metaKey) && drawingManager.selectedDrawingId) {
          e.preventDefault();
          drawingManager.scaleSelected(0.8);
        }
      }
      
      // Escape to exit modes
      if (e.key === 'Escape') {
        e.preventDefault();
        drawingManager.deselectAll();
        drawingManager.setMoveMode(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    textManager.editingTextId, 
    textManager.selectedTextId, 
    textManager.deleteSelectedText,
    drawingManager.selectedDrawingId,
    drawingManager.deleteSelectedDrawing,
    drawingManager.isAllSelected,
    drawingManager.isMoveMode,
    drawingManager.selectAllDrawings,
    drawingManager.deselectAll,
    drawingManager.setMoveMode,
    drawingManager.duplicateSelected,
    drawingManager.flipSelected,
    drawingManager.magicOrganize,
    drawingManager.autoGroup,
    drawingManager.smoothStrokes,
    drawingManager.scaleSelected,
    tool
  ]);

  const handleSetBrushType = (newBrushType: BrushType) => {
    setBrushType(newBrushType);
    setTool('draw'); // Automatically switch to draw tool when selecting a brush
  };

  const handleReset = () => {
    resetCanvas();
    textManager.clearAllText(); // Clear all text when resetting canvas
    drawingManager.clearAllDrawings(); // Clear all drawing elements
    setCanvasKey((k) => k + 1);
  };

  // Enhanced mouse handlers for text and drawing functionality
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'text') {
      // Deselect any selected text when clicking on empty canvas
      textManager.selectTextElement(null);
      
      // Convert screen coordinates to canvas coordinates
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - viewport.x) / viewport.zoom;
        const y = (e.clientY - rect.top - viewport.y) / viewport.zoom;
        textManager.addTextElement(x, y);
      }
    } else if (tool === 'select') {
      // Check for double-click to enter move mode
      const now = Date.now();
      const timeDiff = now - (lastClickTime || 0);
      setLastClickTime(now);
      
      if (timeDiff < 300 && !drawingManager.isMoveMode) {
        // Double-click detected - enter move mode
        drawingManager.setMoveMode(true);
        drawingManager.selectAllDrawings();
      } else if (!drawingManager.isAllSelected && !drawingManager.isMoveMode) {
        // Single click on empty space - deselect all
        drawingManager.selectDrawingElement(null);
      }
    } else if (tool === 'draw' && !isEraserEnabled) {
      // Deselect any selected drawing when starting to draw
      drawingManager.selectDrawingElement(null);
      drawingManager.deselectAll();
      drawingManager.setMoveMode(false);
      
      // Start a new drawing stroke
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - viewport.x) / viewport.zoom;
        const y = (e.clientY - rect.top - viewport.y) / viewport.zoom;
        drawingManager.startStroke({ x, y });
      }
      // Don't call handleMouseDown to prevent original canvas drawing
    } else {
      handleMouseDown(e);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'draw' && !isEraserEnabled && drawingManager.isDrawing) {
      // Add point to current stroke
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - viewport.x) / viewport.zoom;
        const y = (e.clientY - rect.top - viewport.y) / viewport.zoom;
        drawingManager.addPointToStroke({ x, y });
      }
      // Don't call handleMouseMove to prevent original canvas drawing
    } else {
      handleMouseMove(e);
    }
  };

  const handleCanvasMouseUp = () => {
    if (tool === 'draw' && !isEraserEnabled && drawingManager.isDrawing) {
      // Finish the current stroke and add as drawing element
      const lineWidth = brushType === 'pencil' ? 2 : brushType === 'marker' ? 6 : 12;
      const opacity = brushType === 'highlighter' ? 0.3 : 1;
      drawingManager.finishStroke(selectedColor, brushType, lineWidth, opacity);
      // Don't call handleMouseUp to prevent original canvas drawing
    } else {
      handleMouseUp();
    }
  };

  // State for double-click detection
  const [lastClickTime, setLastClickTime] = useState<number>(0);

  // Text handlers
  const handleTextClick = (id: string) => {
    textManager.selectTextElement(id);
  };

  const handleTextDoubleClick = (id: string) => {
    textManager.startEditing(id);
  };

  const handleTextChange = (id: string, text: string) => {
    textManager.updateTextElement(id, { text });
  };

  const handleTextPositionChange = (id: string, x: number, y: number) => {
    textManager.updateTextElement(id, { x, y });
  };

  const handleTextDelete = (id: string) => {
    textManager.deleteTextElement(id);
  };

  // Drawing handlers - single click to select
  const handleDrawingClick = (id: string) => {
    if (id === '') {
      drawingManager.selectDrawingElement(null);
    } else {
      drawingManager.selectDrawingElement(id);
    }
  };

  const handleDrawingMove = (id: string, deltaX: number, deltaY: number) => {
    drawingManager.moveDrawingElement(id, deltaX, deltaY);
  };

  const handleMoveAllDrawings = (deltaX: number, deltaY: number) => {
    drawingManager.moveAllDrawings(deltaX, deltaY);
  };

  const handleDrawingDelete = (id: string) => {
    drawingManager.deleteDrawingElement(id);
  };

  const toolbarProps = {
    isLoading,
    isEraserEnabled,
    currentStep,
    historyLength: history.length,
    tool,
    onCalculate: sendData,
    onReset: handleReset,
    onUndo: undo,
    onRedo: redo,
    onToggleEraser: toggleEraser,
    onSetTool: (tool: any) => setTool(tool),
    onZoomIn: () => handleZoom(true),
    onZoomOut: () => handleZoom(false),
    onCenterCanvas: centerCanvas,
    onToggleMinimap: () => setShowMinimap(!showMinimap),
    toggleHandTool: toggleHandTool,
    onSetBrushType: handleSetBrushType,
    currentBrushType: brushType,
    showColorPicker,
    onToggleColorPicker: () => setShowColorPicker(!showColorPicker),
    onToggleCanvasSettings: () => setShowCanvasSettings(!showCanvasSettings),
    onToggleTextPanel: () => textManager.setTextPanelVisible(!textManager.isTextPanelVisible),
    showTextPanel: textManager.isTextPanelVisible,
    onSelectAllDrawings: drawingManager.selectAllDrawings,
    onDeselectAll: drawingManager.deselectAll,
    onToggleMoveMode: () => drawingManager.setMoveMode(!drawingManager.isMoveMode),
    isAllSelected: drawingManager.isAllSelected,
    isMoveMode: drawingManager.isMoveMode,
  };

  const canvasProps = {
    canvasRef,
    handleMouseDown: handleCanvasMouseDown,
    handleMouseMove: handleCanvasMouseMove,
    handleMouseUp: handleCanvasMouseUp,
    handleMouseOut,
    handleWheel,
    handleContextMenu,
    getCursor,
    viewport,
  };

  // Enhanced Drawing Renderer props
  const drawingRendererProps = {
    drawingElements: drawingManager.drawingElements,
    onDrawingClick: handleDrawingClick,
    onDrawingMove: handleDrawingMove,
    onDrawingDelete: handleDrawingDelete,
    onMoveAllDrawings: handleMoveAllDrawings,
    selectedDrawingId: drawingManager.selectedDrawingId,
    isAllSelected: drawingManager.isAllSelected,
    isMoveMode: drawingManager.isMoveMode,
    currentTool: tool,
    viewportZoom: viewport.zoom,
    viewportX: viewport.x,
    viewportY: viewport.y,
    canvasRef,
    onDuplicateSelected: drawingManager.duplicateSelected,
    onFlipSelected: drawingManager.flipSelected,
    onChangeColorOfSelected: drawingManager.changeColorOfSelected,
    onScaleSelected: drawingManager.scaleSelected,
    onMagicOrganize: drawingManager.magicOrganize,
    onAutoGroup: drawingManager.autoGroup,
    onSmoothStrokes: drawingManager.smoothStrokes,
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      {/* Animated background grid */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'drift 20s ease-in-out infinite alternate'
        }}
      />
      
      {/* Modern Responsive Toolbar */}
      <Toolbar {...toolbarProps} />
      
      {/* Main Canvas */}
      <Canvas key={canvasKey} {...canvasProps} />
      
      {/* Drawing Canvas Overlay - Renders drawing elements */}
      <DrawingCanvas
        drawingElements={drawingManager.drawingElements}
        currentStroke={drawingManager.currentStroke}
        isDrawing={drawingManager.isDrawing}
        selectedColor={selectedColor}
        brushType={brushType}
        viewportZoom={viewport.zoom}
        viewportX={viewport.x}
        viewportY={viewport.y}
        canvasDimensions={canvasDimensions}
      />
      
      {/* Drawing Renderer - Displays selection UI for drawing elements */}
      <DrawingRenderer
        {...drawingRendererProps}
      />
      
      {/* Text Renderer - Displays text elements on canvas */}
      <TextRenderer
        textElements={textManager.textElements}
        currentTextStyle={textManager.currentTextStyle}
        onTextClick={handleTextClick}
        onTextDoubleClick={handleTextDoubleClick}
        onTextPositionChange={handleTextPositionChange}
        onTextDelete={handleTextDelete}
        editingTextId={textManager.editingTextId}
        selectedTextId={textManager.selectedTextId}
        viewportZoom={viewport.zoom}
        viewportX={viewport.x}
        viewportY={viewport.y}
      />
      
      {/* Text Editor - For editing text in place */}
      {textManager.editingTextId && textManager.getTextElementById(textManager.editingTextId) && (
        <TextEditor
          textElement={textManager.getTextElementById(textManager.editingTextId)!}
          textStyle={textManager.currentTextStyle}
          onTextChange={handleTextChange}
          onFinishEditing={textManager.finishEditing}
          onPositionChange={handleTextPositionChange}
          viewportZoom={viewport.zoom}
          viewportX={viewport.x}
          viewportY={viewport.y}
        />
      )}
      
      {/* Text Panel - For text styling controls */}
      <TextPanel
        textStyle={textManager.currentTextStyle}
        onStyleChange={textManager.updateTextStyle}
        isVisible={textManager.isTextPanelVisible}
      />
      
      {/* Modern Minimap - Responsive positioning */}
      {showMinimap && (
        <Minimap
          mainCanvasRef={canvasRef}
          viewport={viewport}
          onViewportChange={setViewport}
          isVisible={showMinimap}
          onToggleVisibility={() => setShowMinimap(!showMinimap)}
          canvasDimensions={canvasDimensions}
        />
      )}
      
      {/* Color Picker - Responsive positioning */}
      <ColorPicker
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        isOpen={showColorPicker}
        onClose={() => setShowColorPicker(false)}
      />
      
      {/* Canvas Settings */}
      <CanvasSettings
        isOpen={showCanvasSettings}
        onClose={() => setShowCanvasSettings(false)}
        canvasBackgroundColor={canvasBackgroundColor}
        onBackgroundColorChange={setCanvasBackgroundColor}
        canvasRef={canvasRef}
        onReset={handleReset}
      />
      
      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts />
      
      {/* Results Display - Responsive */}
      <ResultsDisplay result={result} />

      {/* Loading overlay - Responsive */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-4 max-w-sm w-full text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            <div className="text-white text-base sm:text-lg font-medium">Analyzing your drawing...</div>
            <div className="text-white/60 text-sm">This may take a few moments</div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes drift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(20px, 20px); }
        }
      `}</style>
    </div>
  );
}
