// components/Toolbar.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { BrushType, Tool } from "../lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDebouncedCallback } from "use-debounce";
import { 
  Eraser, 
  Undo, 
  Redo, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Hand, 
  Home, 
  PencilLine, 
  Highlighter, 
  Brush,
  Settings,
  Activity,
  Check,
  Move,
} from "lucide-react";
import { FaFont } from "react-icons/fa";

interface ToolbarProps {
  isLoading: boolean;
  isEraserEnabled: boolean;
  isCanvasEmpty: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
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
  onSetTool: (tool: Tool) => void;
  tool: Tool;
  onToggleCanvasSettings?: () => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  brushOpacity: number;
  onBrushOpacityChange: (opacity: number) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  isLoading,
  isEraserEnabled,
  isCanvasEmpty,
  canUndo = false,
  canRedo = false,
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
  // onToggleMinimap,
  toggleHandTool,
  onSetBrushType,
  currentBrushType,
  onToggleCanvasSettings,
  brushSize,
  onBrushSizeChange,
  brushOpacity,
  onBrushOpacityChange,
  selectedColor,
  onColorChange,
}) => {
  const [activePopover, setActivePopover] = useState<string | null>(null);

  const [localBrushSize, setLocalBrushSize] = useState(brushSize);
  const [localBrushOpacity, setLocalBrushOpacity] = useState(brushOpacity);


  const debouncedBrushSizeChange = useDebouncedCallback(onBrushSizeChange, 10);
  const debouncedBrushOpacityChange = useDebouncedCallback(onBrushOpacityChange, 10);


  useEffect(() => { setLocalBrushSize(brushSize) }, [brushSize]);
  useEffect(() => { setLocalBrushOpacity(brushOpacity) }, [brushOpacity]);


  const handleBrushSizeChange = (value: number[]) => {
    setLocalBrushSize(value[0]);
    debouncedBrushSizeChange(value[0]);
  };

  const handleBrushOpacityChange = (value: number[]) => {
    const newOpacity = value[0] / 100;
    setLocalBrushOpacity(newOpacity);
    debouncedBrushOpacityChange(newOpacity);
  };



  const ToolButton = ({ 
    icon: Icon, 
    label, 
    onClick, 
    isActive = false, 
    disabled = false,
    children
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick?: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children?: React.ReactNode;
  }) => {
    const buttonContent = (
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        className={`h-10 w-10 rounded-lg ${
          isActive 
            ? 'bg-blue-500/20 text-blue-300' 
            : 'text-white/80 hover:bg-white/20'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
          if (children) {
            setActivePopover(activePopover === label ? null : label);
          }
        }}
      >
        <Icon className="w-5 h-5" />
      </Button>
    );

    const withTooltip = (
      <Tooltip>
        <TooltipTrigger asChild>{children ? <PopoverTrigger asChild>{buttonContent}</PopoverTrigger> : buttonContent}</TooltipTrigger>
        <TooltipContent side="top" sideOffset={15} className="z-[60]">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );

    if (children) {
      return (
        <Popover open={activePopover === label} onOpenChange={(isOpen) => setActivePopover(isOpen ? label : null)}>
          {withTooltip}
          <PopoverContent side="bottom" className="w-64 bg-black/80 backdrop-blur-md border-gray-700 text-white p-4 z-[55]">
            {children}
          </PopoverContent>
        </Popover>
      );
    }

    return withTooltip;
  };

  const BrushIcon = currentBrushType === 'pencil' ? PencilLine : currentBrushType === 'marker' ? Brush : Highlighter;
  
  // Debug logging
  console.log('🛠️ TOOLBAR RENDER - tool:', tool, 'isEraserEnabled:', isEraserEnabled, 'eraser isActive:', tool === 'eraser');

  const PRESET_COLORS = [
    '#ffffff', '#000000', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24',
    '#6c5ce7', '#fd79a8', '#636e72', '#a0a0a0', '#00d2d3', '#ff9f43',
  ];

  const BrushPreview = () => (
    <div className="w-full h-12 bg-gray-800/50 rounded-lg mt-2 flex items-center justify-center">
      <div 
        style={{
          width: `${localBrushSize}px`,
          height: `${localBrushSize}px`,
          backgroundColor: selectedColor,
          borderRadius: '50%',
          opacity: localBrushOpacity,
        }}
      />
    </div>
  );



  const BrushOptions = () => (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-white/70">Type</label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          
          <Button size="sm" variant={currentBrushType === 'pencil' ? 'secondary' : 'ghost'} onClick={() => onSetBrushType('pencil')} className="flex flex-col h-16">
            <PencilLine className="w-5 h-5 mb-1" />
            <span className="text-xs">Pencil</span>
          </Button>

          <Button size="sm" variant={currentBrushType === 'marker' ? 'secondary' : 'ghost'} onClick={() => onSetBrushType('marker')} className="flex flex-col h-16">
            <Brush className="w-5 h-5 mb-1" />
            <span className="text-xs">Marker</span>
          </Button>

           <Button size="sm" variant={currentBrushType === 'highlighter' ? 'secondary' : 'ghost'} onClick={() => onSetBrushType('highlighter')} className="flex flex-col h-16">
            <Highlighter className="w-5 h-5 mb-1" />
            <span className="text-xs">Highlighter</span>
          </Button>

        </div>
      </div>
      <div>
        <label className="text-xs text-white/70">Size: {localBrushSize}px</label>
        <Slider value={[localBrushSize]} onValueChange={handleBrushSizeChange} min={1} max={50} step={1} className="mt-2" />
      </div>
      <div>
        <label className="text-xs text-white/70">Opacity: {Math.round(localBrushOpacity * 100)}%</label>
        <Slider value={[localBrushOpacity * 100]} onValueChange={handleBrushOpacityChange} min={1} max={100} step={1} className="mt-2" />
      </div>
      <BrushPreview />
    </div>
  );



  const ColorOptions = () => (
    <div>
      <div className="grid grid-cols-6 gap-2">
        {PRESET_COLORS.map(color => (
          <Button
            key={color}
            onClick={() => onColorChange(color)}
            style={{ backgroundColor: color }}
            className={`w-8 h-8 rounded-md border-2 transition-transform hover:scale-110 ${selectedColor === color ? 'border-blue-400 scale-105' : 'border-white/20'}`}
          >
            {selectedColor === color && <Check className="w-5 h-5 text-black mix-blend-difference" />}
          </Button>
        ))}
      </div>
      <div className="relative mt-4">
        <div className="w-full h-10 rounded-lg border border-white/20" style={{background: `linear-gradient(to right, ${selectedColor}, transparent)`}}/>
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      {/* Main Toolbar */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95vw] sm:w-auto">
        <div className="flex items-center gap-2 p-2 rounded-xl backdrop-blur-lg bg-black/40 border border-white/20 shadow-2xl overflow-x-auto no-scrollbar">
          
          <ToolButton
            icon={Hand}
            label="Pan Tool (H)"
            onClick={toggleHandTool}
            isActive={tool === 'hand'}
          />
          
          <ToolButton
            icon={BrushIcon}
            label="Brush Tool"
            isActive={tool === 'draw' && !isEraserEnabled}
            onClick={() => onSetTool('draw')}
          >
            <BrushOptions />
          </ToolButton>

          <ToolButton
            icon={Eraser}
            label="Eraser (E)"
            onClick={() => {
              console.log('Eraser button clicked! Current tool:', tool);
              onToggleEraser();
            }}
            isActive={tool === 'eraser'}
          />
          
          {/* Temporarily removed EraserOptions popover for debugging */}

          <ToolButton
            icon={FaFont}
            label="Text Tool (T)"
            onClick={() => onSetTool('text')}
            isActive={tool === 'text'}
          />

          <ToolButton
            icon={Move}
            label="Selection Tool (S)"
            onClick={() => onSetTool('selection')}
            isActive={tool === 'selection'}
          />
          
          <div className="w-px h-6 bg-white/20 mx-2" />
          
          <Popover>
             <PopoverTrigger asChild>
                <Button
                    style={{ backgroundColor: selectedColor }}
                    className="w-7 h-7 rounded-full border-2 border-white/50 transition-transform hover:scale-110"
                    aria-label="Color Picker"
                />
             </PopoverTrigger>
             <PopoverContent side="bottom" className="w-auto bg-black/80 backdrop-blur-md border-gray-700 text-white p-4">
               <ColorOptions />
             </PopoverContent>
           </Popover>

          <div className="w-px h-6 bg-white/20 mx-2" />
          
          <ToolButton icon={Undo} label="Undo" onClick={onUndo} disabled={!canUndo} />
          <ToolButton icon={Redo} label="Redo" onClick={onRedo} disabled={!canRedo} />
          
          <div className="w-px h-6 bg-white/20 mx-2" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onCalculate} disabled={isLoading || isCanvasEmpty} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 h-10 rounded-lg">
                {isLoading ? <Activity className="w-5 h-5 animate-spin" /> : "Calculate"}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={15} className="z-[60]">
              <p>Calculate Expression</p>
            </TooltipContent>
          </Tooltip>

        </div>
      </div>

      {/* View Controls Toolbar */}
       <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
         <div className="flex items-center gap-2 p-2 rounded-xl backdrop-blur-lg bg-black/40 border border-white/20 shadow-2xl">
            <ToolButton icon={ZoomOut} label="Zoom Out" onClick={onZoomOut} />
            <ToolButton icon={Home} label="Reset Zoom" onClick={onCenterCanvas} />
            <ToolButton icon={ZoomIn} label="Zoom In" onClick={onZoomIn} />
            <div className="w-px h-6 bg-white/20 mx-2" />
            <ToolButton icon={Settings} label="Settings" onClick={onToggleCanvasSettings} />
            {/* <ToolButton icon={Map} label="Toggle Minimap" onClick={onToggleMinimap} /> */}
             <ToolButton icon={RotateCcw} label="Reset Canvas" onClick={onReset} />
         </div>
       </div>
    </TooltipProvider>
  );
};

export default Toolbar;