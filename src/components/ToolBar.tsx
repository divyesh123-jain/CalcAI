// components/Toolbar.tsx
"use client";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { BrushType, Tool } from "../lib/types";
import { 
  Calculator, 
  Eraser, 
  Undo, 
  Redo, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  MousePointer, 
  Hand, 
  Home, 
  Map, 
  PencilLine, 
  Highlighter, 
  Brush,
  Settings,
  Palette,
  Eye,
  EyeOff,
  Sparkles,
  Activity,
  Type,
  MousePointer2,
  Move,
  CheckSquare
} from "lucide-react";

interface ToolbarProps {
  isLoading: boolean;
  isEraserEnabled: boolean;
  currentStep: number;
  historyLength: number;
  onCalculate: () => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleEraser: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenterCanvas: () => void;
  onToggleMinimap: () => void;
  toggleHandTool: () => void;
  onSetBrushType: (brushType: BrushType) => void;
  currentBrushType: BrushType;
  onSetTool: React.Dispatch<React.SetStateAction<Tool>>;
  tool: Tool;
  showColorPicker?: boolean;
  onToggleColorPicker?: () => void;
  onToggleCanvasSettings?: () => void;
  onToggleTextPanel?: () => void;
  showTextPanel?: boolean;
  onSelectAllDrawings?: () => void;
  onDeselectAll?: () => void;
  onToggleMoveMode?: () => void;
  isAllSelected?: boolean;
  isMoveMode?: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  isLoading,
  isEraserEnabled,
  currentStep,
  historyLength,
  tool,
  onCalculate,
  onReset,
  onUndo,
  onRedo,
  onToggleEraser,
  onSetTool,
  onZoomIn,
  onZoomOut,
  onCenterCanvas,
  onToggleMinimap,
  toggleHandTool,
  onSetBrushType,
  currentBrushType,
  showColorPicker = false,
  onToggleColorPicker,
  onToggleCanvasSettings,
  onToggleTextPanel,
  showTextPanel = false,
  onSelectAllDrawings,
  onDeselectAll,
  onToggleMoveMode,
  isAllSelected,
  isMoveMode,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const ToolButton = ({ 
    icon: Icon, 
    label, 
    onClick, 
    isActive = false, 
    disabled = false,
    className = "",
    badge = null
  }: {
    icon: React.ComponentType<any>;
    label: string;
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    className?: string;
    badge?: string | null;
  }) => (
    <div className={`relative group ${className}`}>
      <Button
        onClick={onClick}
        disabled={disabled}
        className={`
          relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 p-0 
          rounded-lg sm:rounded-xl backdrop-blur-md
          ${isActive 
            ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border-cyan-400/50 shadow-lg shadow-cyan-500/25' 
            : 'bg-white/5 hover:bg-white/10 border-white/10'
          }
          border transition-all duration-300 hover:scale-105 hover:shadow-lg
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-400/30'}
        `}
      >
        <Icon className={`w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 ${isActive ? 'text-cyan-300' : 'text-white/80'}`} />
        {badge && (
          <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 text-xs rounded-full flex items-center justify-center text-white">
            {badge}
          </span>
        )}
      </Button>
      
      {/* Tooltip - Hidden on small screens */}
      <div className="hidden md:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
        {label}
      </div>
    </div>
  );

  return (
    <>
      {/* Main Toolbar - Responsive */}
      <div className="fixed top-2 sm:top-6 left-2 right-2 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 z-50">
        <div className="flex items-center gap-1 sm:gap-3 p-2 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-lg bg-black/20 border border-white/10 shadow-2xl overflow-x-auto">
          
          {/* Calculate Button - Special highlighted button */}
          <div className="relative flex-shrink-0">
            <Button
              onClick={onCalculate}
              disabled={isLoading}
              className={`
                px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base
                ${isLoading
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400'
                }
                text-white shadow-lg hover:scale-105 hover:shadow-xl
              `}
            >
              {isLoading ? (
                <>
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                  <span className="hidden sm:inline">Analyzing...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Calculate</span>
                  <span className="sm:hidden">Calc</span>
                </>
              )}
            </Button>
          </div>

          <div className="w-px h-6 sm:h-8 bg-white/20 flex-shrink-0" />

          {/* Tool Selection */}
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            <ToolButton
              icon={MousePointer}
              label="Draw Tool (D)"
              onClick={() => onSetTool('draw')}
              isActive={tool === 'draw' && !isEraserEnabled}
            />
            <ToolButton
              icon={MousePointer2}
              label="Select Tool (S)"
              onClick={() => onSetTool('select')}
              isActive={tool === 'select'}
            />
            <ToolButton
              icon={Hand}
              label="Pan Tool (H)"
              onClick={toggleHandTool}
              isActive={tool === 'hand'}
            />
            <ToolButton
              icon={Type}
              label="Text Tool (T)"
              onClick={() => onSetTool('text')}
              isActive={tool === 'text'}
            />
            <ToolButton
              icon={Eraser}
              label="Eraser (E)"
              onClick={onToggleEraser}
              isActive={isEraserEnabled || tool === 'eraser'}
            />
          </div>

          <div className="w-px h-6 sm:h-8 bg-white/20 flex-shrink-0" />

          {/* Brush Types */}
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            <ToolButton
              icon={PencilLine}
              label="Pencil (1)"
              onClick={() => { onSetBrushType('pencil'); onSetTool('draw'); }}
              isActive={currentBrushType === 'pencil' && !isEraserEnabled}
            />
            <ToolButton
              icon={Brush}
              label="Marker (2)"
              onClick={() => { onSetBrushType('marker'); onSetTool('draw'); }}
              isActive={currentBrushType === 'marker' && !isEraserEnabled}
            />
            <ToolButton
              icon={Highlighter}
              label="Highlighter (3)"
              onClick={() => { onSetBrushType('highlighter'); onSetTool('draw'); }}
              isActive={currentBrushType === 'highlighter' && !isEraserEnabled}
            />
          </div>

          <div className="w-px h-6 sm:h-8 bg-white/20 flex-shrink-0" />

          {/* History Controls */}
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            <ToolButton
              icon={Undo}
              label="Undo (Ctrl+Z)"
              onClick={onUndo}
              disabled={currentStep <= 0}
            />
            <ToolButton
              icon={Redo}
              label="Redo (Ctrl+Y)"
              onClick={onRedo}
              disabled={currentStep >= historyLength - 1}
            />
          </div>

          <div className="w-px h-6 sm:h-8 bg-white/20 flex-shrink-0" />

          {/* View Controls */}
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            <ToolButton
              icon={ZoomIn}
              label="Zoom In (+)"
              onClick={onZoomIn}
            />
            <ToolButton
              icon={ZoomOut}
              label="Zoom Out (-)"
              onClick={onZoomOut}
            />
            <ToolButton
              icon={Home}
              label="Center Canvas"
              onClick={onCenterCanvas}
              className="hidden sm:block"
            />
          </div>

          <div className="w-px h-6 sm:h-8 bg-white/20 flex-shrink-0" />

          {/* Additional Controls */}
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            {/* Drawing Controls - only show when in select tool */}
            {tool === 'select' && onSelectAllDrawings && (
              <>
                <ToolButton
                  icon={CheckSquare}
                  label="Select All (Ctrl+A)"
                  onClick={isAllSelected ? onDeselectAll! : onSelectAllDrawings}
                  isActive={isAllSelected}
                />
                <ToolButton
                  icon={Move}
                  label="Move Mode (M)"
                  onClick={onToggleMoveMode!}
                  isActive={isMoveMode}
                />
                <div className="w-px h-6 sm:h-8 bg-white/20 flex-shrink-0" />
              </>
            )}
            
            <ToolButton
              icon={Map}
              label="Toggle Minimap"
              onClick={onToggleMinimap}
              className="hidden sm:block"
            />
            {onToggleColorPicker && (
              <ToolButton
                icon={Palette}
                label="Color Picker"
                onClick={onToggleColorPicker}
                isActive={showColorPicker}
              />
            )}
            {onToggleTextPanel && tool === 'text' && (
              <ToolButton
                icon={Type}
                label="Text Panel"
                onClick={onToggleTextPanel}
                isActive={showTextPanel}
              />
            )}
            {onToggleCanvasSettings && (
              <ToolButton
                icon={Settings}
                label="Canvas Settings"
                onClick={onToggleCanvasSettings}
              />
            )}
            <ToolButton
              icon={RotateCcw}
              label="Reset Canvas"
              onClick={onReset}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Status Bar - Responsive positioning */}
      <div className="fixed bottom-2 left-2 right-2 sm:bottom-6 sm:left-6 sm:right-auto flex gap-2 sm:gap-3 z-40">
        <div className="flex-1 sm:flex-initial px-2 py-1 sm:px-3 sm:py-2 rounded-lg backdrop-blur-md bg-black/20 border border-white/10 text-white/80 text-xs sm:text-sm text-center sm:text-left">
          <span className="sm:hidden">Tool: </span>
          <span className="hidden sm:inline">Tool: </span>
          <span className="text-cyan-300 capitalize">{tool}</span>
        </div>
        {currentBrushType && !isEraserEnabled && (
          <div className="flex-1 sm:flex-initial px-2 py-1 sm:px-3 sm:py-2 rounded-lg backdrop-blur-md bg-black/20 border border-white/10 text-white/80 text-xs sm:text-sm text-center sm:text-left">
            <span className="sm:hidden">Brush: </span>
            <span className="hidden sm:inline">Brush: </span>
            <span className="text-purple-300 capitalize">{currentBrushType}</span>
          </div>
        )}
        <div className="flex-1 sm:flex-initial px-2 py-1 sm:px-3 sm:py-2 rounded-lg backdrop-blur-md bg-black/20 border border-white/10 text-white/80 text-xs sm:text-sm text-center sm:text-left">
          <span className="sm:hidden">Step: </span>
          <span className="hidden sm:inline">History: </span>
          <span className="text-emerald-300">{currentStep + 1}/{historyLength}</span>
        </div>
      </div>
    </>
  );
};

export default Toolbar;