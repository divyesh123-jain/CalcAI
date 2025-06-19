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
import { useDashboard } from "./useDashboard";
import { BrushType, TextElement, TextStyle } from "../../lib/types";
import { TextEditor } from '../Text/TextEditor';
import { TextPanel } from '../Text/TextPanel';

declare global {
  interface Window {
    MathJax: any;
  }
}

export default function DashboardComponent() {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const [showCanvasSettings, setShowCanvasSettings] = useState(false);
  const [texts, setTexts] = useState<TextElement[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [textStyle, setTextStyle] = useState<TextStyle>({
    fontFamily: 'Inter, sans-serif',
    fontSize: 16,
    color: '#000000',
    opacity: 1,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
  });
  
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
      window.MathJax?.typesetPromise?.();
    }
  }, [latexExpression]);

  const handleSetBrushType = (newBrushType: BrushType) => {
    setBrushType(newBrushType);
    setTool('draw'); // Automatically switch to draw tool when selecting a brush
  };

  const handleReset = () => {
    resetCanvas();
    setTexts([]);
    setSelectedTextId(null);
    setCanvasKey((k) => k + 1);
  };

  const toolbarProps = {
    isLoading,
    isEraserEnabled,
    currentStep,
    historyLength: history.length,
    tool,
    onCalculate: () => sendData(texts, textStyle),
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
  };

  const canvasProps = {
    canvasRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseOut,
    handleWheel,
    handleContextMenu,
    getCursor,
    viewport,
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (tool !== 'text') return;

    // Prevent creating text when clicking on existing text elements or UI
    const target = e.target as HTMLElement;
    if (target.closest('.text-element') || 
        target.closest('.text-panel') || 
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'BUTTON') {
      return;
    }

    // If there's already a selected text that's being edited, don't create new one
    if (selectedTextId && texts.find(t => t.id === selectedTextId && !t.text.trim())) {
      return;
    }

    // Deselect current text if clicking empty space
    if (selectedTextId) {
      setSelectedTextId(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newText: TextElement = {
      id: Date.now().toString(),
      text: '',
      x,
      y,
      rotation: 0,
    };

    setTexts([...texts, newText]);
    setSelectedTextId(newText.id);
  };

  const handleTextChange = (id: string, newText: string) => {
    setTexts(texts.map(text => 
      text.id === id ? { ...text, text: newText } : text
    ));
  };

  const handleTextFinish = (id: string) => {
    setTexts(texts.filter(text => text.id !== id || text.text.trim() !== ''));
    setSelectedTextId(null);
  };

  const handleTextPosition = (id: string, x: number, y: number) => {
    setTexts(texts.map(text =>
      text.id === id ? { ...text, x, y } : text
    ));
  };

  const handleTextRotation = (id: string, rotation: number) => {
    setTexts(texts.map(text =>
      text.id === id ? { ...text, rotation } : text
    ));
  };

  const handleTextDelete = (id: string) => {
    setTexts(texts.filter(text => text.id !== id));
    setSelectedTextId(null);
  };

  const handleStyleChange = (style: Partial<TextStyle>) => {
    setTextStyle(prev => ({ ...prev, ...style }));
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
          
          {/* Text Elements */}
          {texts.map(text => (
            <TextEditor
              key={text.id}
              textElement={text}
              textStyle={textStyle}
              onTextChange={handleTextChange}
              onFinishEditing={handleTextFinish}
              onPositionChange={handleTextPosition}
              onRotationChange={handleTextRotation}
              onDelete={handleTextDelete}
              isSelected={selectedTextId === text.id}
              viewportZoom={viewport.zoom}
              onSelect={() => setSelectedTextId(text.id)}
            />
          ))}
        </div>
      </div>
      
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

      {/* Enhanced Text Panel with surprise features */}
      <TextPanel
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
      />

      <style jsx>{`
        @keyframes drift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(20px, 20px); }
        }
      `}</style>
    </div>
  );
}
