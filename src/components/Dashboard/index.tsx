/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";
import React, { useEffect, useState } from "react";
import Canvas from "../canvas/Canvas";
import Toolbar from "../ToolBar";
// import Minimap from "../Minimap";
import ResultsDisplay from "../ResultDisplay";
import KeyboardShortcuts from "../KeyboardShortcuts";
import ColorPicker from "../ColorPicker";
import CanvasSettings from "../CanvasSettings";
import { useDashboard } from "./useDashboard";
import SelectionToolbar from '../SelectionToolbar';
import { getStrokesBoundingBox } from "@/lib/canvas-utils";
import { Stroke } from "@/lib/types";
import { useText } from "@/hooks/useText";
import { TextEditor } from "../Text/TextEditor";
import { TextPanel } from "../Text/TextPanel";

declare global {
  interface Window {
    MathJax: any;
  }
}

export default function DashboardComponent() {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCanvasSettings, setShowCanvasSettings] = useState(false);
  const dashboard = useDashboard();
  const {
    canvasRef,
    selectedColor,
    result,
    isLoading,
    isEraserEnabled,
    canUndo,
    canRedo,
    tool,
    brushType,
    brushSize,
    brushOpacity,
    eraserSize,
    showMinimap,
    canvasBackgroundColor,
    setSelectedColor,
    setTool,
    setShowMinimap,
    setBrushType,
    setBrushSize,
    setBrushOpacity,
    setEraserSize,
    setCanvasBackgroundColor,
    sendData,
    undo,
    redo,
    resetCanvas,
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
    centerCanvas,
    toggleHandTool,
    toggleEraser,
    getCursor,
  } = dashboard;
  const {
    texts,
    selectedTextId,
    textStyle,
    createText,
    updateText,
    deleteText,
    updateTextPosition,
    updateTextRotation,
    finishEditing,
    setSelectedTextId,
    setTextStyle,
  } = useText();
  const [canvasKey, setCanvasKey] = useState(0);

  useEffect(() => {
    // Load MathJax
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
    if (dashboard.latexExpression.length > 0) {
      window.MathJax?.typesetPromise?.();
    }
  }, [dashboard.latexExpression]);

  const handleReset = () => {
    resetCanvas();
    // Also reset text state if needed
    // setTexts([]);
    setCanvasKey((k) => k + 1);
  };

  const isCanvasEmpty = dashboard.elements.length === 0 && texts.length === 0;

  const handleStyleChange = (style: Partial<typeof textStyle>) => {
    setTextStyle(prev => ({ ...prev, ...style }));
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (tool === 'text') {
      const target = e.target as HTMLElement;
      if (target.closest('.text-editor-container') || target.closest('.text-panel')) {
        return;
      }

      if (selectedTextId) {
        finishEditing(selectedTextId);
        return;
      }
      
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = (e.clientX - rect.left - dashboard.viewport.x) / dashboard.viewport.zoom;
      const y = (e.clientY - rect.top - dashboard.viewport.y) / dashboard.viewport.zoom;
      createText(x, y);
    }
  };

  const toolbarProps = {
    isLoading,
    isEraserEnabled,
    canUndo,
    canRedo,
    tool,
    onCalculate: sendData,
    isCanvasEmpty,
    onReset: handleReset,
    onUndo: undo,
    onRedo: redo,
    onToggleEraser: toggleEraser,
    onSetTool: setTool,
    onZoomIn: () => handleZoom(true),
    onZoomOut: () => handleZoom(false),
    onCenterCanvas: centerCanvas,
    onToggleMinimap: () => setShowMinimap(!showMinimap),
    toggleHandTool: toggleHandTool,
    onSetBrushType: (newBrushType: any) => {
      setBrushType(newBrushType);
      setTool('draw');
    },
    currentBrushType: brushType,
    showColorPicker,
    onToggleColorPicker: () => setShowColorPicker(!showColorPicker),
    onToggleCanvasSettings: () => setShowCanvasSettings(!showCanvasSettings),
    brushSize,
    onBrushSizeChange: setBrushSize,
    brushOpacity,
    onBrushOpacityChange: setBrushOpacity,
    eraserSize,
    onEraserSizeChange: setEraserSize,
    selectedColor,
    onColorChange: setSelectedColor,
  };

  const canvasProps = {
    canvasRef,
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
    getCursor,
    viewport: dashboard.viewport,
    selection: dashboard.selection,
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
      
      {/* Canvas */}
      <div className="relative w-full h-full overflow-hidden">
        <div 
          className="canvas-container w-full h-full"
          onClick={handleCanvasClick}
        >
          <Canvas key={canvasKey} {...canvasProps} />
          <SelectionManager dashboard={dashboard} />
          {/* Text Elements */}
          {texts.map(text => (
            <TextEditor
              key={text.id}
              textElement={text}
              textStyle={textStyle}
              onTextChange={updateText}
              onFinishEditing={finishEditing}
              onPositionChange={updateTextPosition}
              onRotationChange={updateTextRotation}
              onDelete={deleteText}
              isSelected={selectedTextId === text.id}
              onSelect={() => setSelectedTextId(text.id)}
            />
          ))}
        </div>
      </div>
      
      {/* Modern Minimap - Responsive positioning */}
      {/* {showMinimap && (
        <Minimap
          mainCanvasRef={worldCanvasRef}
          viewport={dashboard.viewport}
          onViewportChange={dashboard.setViewport}
          isVisible={showMinimap}
          onToggleVisibility={() => setShowMinimap(!showMinimap)}
          canvasDimensions={{ width: 5000, height: 5000 }}
        />
      )} */}
      
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

   
      {/* TextPanel - This component is no longer used as text editing is handled by TextEditor */}
      {/* <TextPanel
        textStyle={textStyle}
        onStyleChange={handleStyleChange}
        isVisible={tool === 'text'}
        selectedTextId={selectedTextId}
        onDuplicateText={() => {
          if (selectedTextId) {
            const selectedText = texts.find(t => t.id === selectedTextId);
            if (selectedText) {
              const newText: TextElement = {
                ...selectedText,
                id: Date.now().toString(),
                x: selectedText.x + 20,
                y: selectedText.y + 20,
              };
              setTexts([...texts, newText]);
              setSelectedTextId(newText.id);
            }
          }
        }}
        onClearAllText={() => {
          setTexts([]);
          setSelectedTextId(null);
        }}
      /> */}

      {selectedTextId && (
        <TextPanel 
          textStyle={textStyle}
          onStyleChange={handleStyleChange}
          isVisible={!!selectedTextId}
        />
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

const SelectionManager = ({ dashboard }: { dashboard: any }) => {
  const { 
    elements, 
    selectedElementIds, 
    viewport, 
    sendData, 
    setSelectedElementIds,
    scaleSelection,
  } = dashboard;

  if (selectedElementIds.length === 0) {
    return null;
  }

  const selectedStrokes = elements.filter((el: Stroke) => selectedElementIds.includes(el.id));
  const boundingBox = getStrokesBoundingBox(selectedStrokes);

  if (!boundingBox) {
    return null;
  }

  const { x, y, width, height } = boundingBox;

  return (
    <div
      className="absolute pointer-events-none border border-blue-500 border-dashed"
      style={{
        left: `${viewport.x + x * viewport.zoom}px`,
        top: `${viewport.y + y * viewport.zoom}px`,
        width: `${width * viewport.zoom}px`,
        height: `${height * viewport.zoom}px`,
      }}
    >
      <div className="absolute -top-10 right-0 pointer-events-auto">
        <SelectionToolbar
          onSolve={sendData}
          onZoomIn={() => scaleSelection(1.1)}
          onZoomOut={() => scaleSelection(0.9)}
          onClearSelection={() => setSelectedElementIds([])}
        />
      </div>
      {/* Resize Handles */}
      <div onMouseDown={(e) => { e.stopPropagation(); dashboard.handleMouseDown(e, 'top-left'); }} className="absolute -left-1 -top-1 w-3 h-3 bg-blue-500 cursor-nwse-resize pointer-events-auto" />
      <div onMouseDown={(e) => { e.stopPropagation(); dashboard.handleMouseDown(e, 'top-right'); }} className="absolute -right-1 -top-1 w-3 h-3 bg-blue-500 cursor-nesw-resize pointer-events-auto" />
      <div onMouseDown={(e) => { e.stopPropagation(); dashboard.handleMouseDown(e, 'bottom-left'); }} className="absolute -left-1 -bottom-1 w-3 h-3 bg-blue-500 cursor-nesw-resize pointer-events-auto" />
      <div onMouseDown={(e) => { e.stopPropagation(); dashboard.handleMouseDown(e, 'bottom-right'); }} className="absolute -right-1 -bottom-1 w-3 h-3 bg-blue-500 cursor-nwse-resize pointer-events-auto" />
    </div>
  );
};
