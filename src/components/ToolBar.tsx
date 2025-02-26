// components/Toolbar.tsx
"use client";
import React from "react";
import { Button } from "./ui/button";
import { Eraser, Undo, Redo, RotateCcw , ZoomIn ,  ZoomOut , MousePointer , Hand , Home , Maximize } from "lucide-react";

interface ToolbarProps {
  isLoading: boolean;
  isEraserEnabled: boolean;
  currentStep: number;
  historyLength: number;
  tool: 'draw' | 'hand' | 'eraser';
  onCalculate: () => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleEraser: () => void;
  onSetTool: React.Dispatch<React.SetStateAction<"draw" | "hand" | "eraser">>;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenterCanvas: () => void;
  onToggleMinimap: () => void;
  toggleHandTool: () => void;
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
}) => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center shadow-indigo-500/50 shadow-2xl gap-4 p-4 rounded-xl backdrop-blur-md z-10">
      <Button
        onClick={onCalculate}
        disabled={isLoading}
        className="flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50  transition-all"
      >

        {isLoading ? "Calculating..." : "Calculate"}
      </Button>

      <Button
        onClick={onReset}
        disabled={isLoading}
        className="flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50  transition-all"
      >
        <RotateCcw className="w-4 h-4" />
        Reset
      </Button>

      <Button
        onClick={onCenterCanvas}
        className="flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50 transition-all"
        title="Center Canvas (Home)"
      >
        <Home className="w-4 h-4" />
      </Button>

      <Button
        onClick={onToggleMinimap}
        className="flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50 transition-all"
        title="Toggle Minimap (M)"
      >
        <Maximize className="w-4 h-4" />
      </Button>

      <Button
        onClick={onUndo}
        disabled={currentStep <= 0}
        className="flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50  transition-all"
      >
        <Undo className="w-4 h-4" />
        Undo
      </Button>

      <Button
        onClick={onRedo}
        disabled={currentStep >= historyLength - 1}
        className="flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50  transition-all"
      >
        <Redo className="w-4 h-4" />
        Redo
      </Button>

      <Button
        onClick={onToggleEraser}
        className={`flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50  transition-all ${
          isEraserEnabled ? 'bg-blue-600 hover:bg-blue-700' : ''
        }`}
      >
        <Eraser className="w-4 h-4" />
        {isEraserEnabled ? 'Eraser' : 'Eraser'}
      </Button>

      <Button
        onClick={() => onSetTool('draw')}
        className={`flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50 transition-all ${
          tool === 'draw' ? 'bg-blue-600' : ''
        }`}
      >
        <MousePointer className="w-4 h-4" />
      </Button>

      <Button
        onClick={toggleHandTool}
        className={`flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50 transition-all ${
          tool === 'hand' ? 'bg-blue-600' : ''
        }`}
      >
        <Hand className="w-4 h-4" />
      </Button>


      <Button
        onClick={onZoomIn}
        className="flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50 transition-all"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>

      <Button
        onClick={onZoomOut}
        className="flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50 transition-all"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default Toolbar;