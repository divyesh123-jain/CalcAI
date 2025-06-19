"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DrawingElement } from '../lib/types';
import { X, Copy, FlipHorizontal, FlipVertical, Palette, ZoomIn, ZoomOut, Sparkles, Grid3X3, Group } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDuplicate: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onChangeColor: () => void;
  onScaleUp: () => void;
  onScaleDown: () => void;
  onMagicOrganize: () => void;
  onAutoGroup: () => void;
  onSmoothStrokes: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x, y, onClose, onDuplicate, onFlipHorizontal, onFlipVertical,
  onChangeColor, onScaleUp, onScaleDown, onMagicOrganize, onAutoGroup, onSmoothStrokes
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const MenuItem = ({ icon: Icon, label, onClick, color = "text-white" }: {
    icon: React.ComponentType<any>;
    label: string;
    onClick: () => void;
    color?: string;
  }) => (
    <button
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors duration-200 ${color}`}
      onClick={() => { onClick(); onClose(); }}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden min-w-48"
      style={{ left: x, top: y }}
    >
      <div className="py-2">
        <div className="px-4 py-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-cyan-400">Magic Tools</span>
          </div>
        </div>
        
        <MenuItem icon={Copy} label="Duplicate" onClick={onDuplicate} />
        <MenuItem icon={FlipHorizontal} label="Flip Horizontal" onClick={onFlipHorizontal} />
        <MenuItem icon={FlipVertical} label="Flip Vertical" onClick={onFlipVertical} />
        <MenuItem icon={Palette} label="Random Color" onClick={onChangeColor} color="text-purple-400" />
        
        <div className="border-t border-white/10 my-2"></div>
        
        <MenuItem icon={ZoomIn} label="Scale Up 150%" onClick={onScaleUp} />
        <MenuItem icon={ZoomOut} label="Scale Down 75%" onClick={onScaleDown} />
        
        <div className="border-t border-white/10 my-2"></div>
        
        <MenuItem icon={Grid3X3} label="Magic Organize All" onClick={onMagicOrganize} color="text-emerald-400" />
        <MenuItem icon={Group} label="Auto Group" onClick={onAutoGroup} color="text-emerald-400" />
        <MenuItem icon={Sparkles} label="Smooth All Strokes" onClick={onSmoothStrokes} color="text-emerald-400" />
      </div>
    </div>
  );
};

interface DrawingRendererProps {
  drawingElements: DrawingElement[];
  onDrawingClick: (id: string) => void;
  onDrawingMove: (id: string, deltaX: number, deltaY: number) => void;
  onDrawingDelete: (id: string) => void;
  onMoveAllDrawings: (deltaX: number, deltaY: number) => void;
  selectedDrawingId: string | null;
  isAllSelected: boolean;
  isMoveMode: boolean;
  currentTool: string;
  viewportZoom: number;
  viewportX: number;
  viewportY: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  // 🎉 Surprise feature props!
  onDuplicateSelected?: () => void;
  onFlipSelected?: (direction: 'horizontal' | 'vertical') => void;
  onChangeColorOfSelected?: (color: string) => void;
  onScaleSelected?: (factor: number) => void;
  onMagicOrganize?: () => void;
  onAutoGroup?: () => void;
  onSmoothStrokes?: () => void;
}

export const DrawingRenderer: React.FC<DrawingRendererProps> = ({
  drawingElements,
  onDrawingClick,
  onDrawingMove,
  onDrawingDelete,
  onMoveAllDrawings,
  selectedDrawingId,
  isAllSelected,
  isMoveMode,
  currentTool,
  viewportZoom,
  viewportX,
  viewportY,
  canvasRef,
  onDuplicateSelected,
  onFlipSelected,
  onChangeColorOfSelected,
  onScaleSelected,
  onMagicOrganize,
  onAutoGroup,
  onSmoothStrokes
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [isDraggingAll, setIsDraggingAll] = useState(false);
  const [lastDragPos, setLastDragPos] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleElementClick = (e: React.MouseEvent, element: DrawingElement) => {
    e.stopPropagation();
    
    // Only handle clicks in select mode
    if (currentTool !== 'select') return;
    
    // If in move mode or all selected, don't change selection
    if (isMoveMode || isAllSelected) {
      return;
    }
    
    // Single click to select/deselect
    if (selectedDrawingId === element.id) {
      // If already selected, deselect
      onDrawingClick('');
    } else {
      // Select this element
      onDrawingClick(element.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, element?: DrawingElement) => {
    e.preventDefault();
    
    if (currentTool !== 'select') return;
    
    // If clicking on an element, select it first
    if (element && selectedDrawingId !== element.id) {
      onDrawingClick(element.id);
    }
    
    // Only show context menu if something is selected or we have drawings
    if (selectedDrawingId || drawingElements.length > 0) {
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  };

  // Random color generator
  const getRandomColor = () => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleMouseDown = (e: React.MouseEvent, element?: DrawingElement) => {
    e.stopPropagation();
    
    // Only handle dragging in select mode
    if (currentTool !== 'select') return;
    
    if (isAllSelected || isMoveMode) {
      // Start dragging all elements
      setIsDraggingAll(true);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setLastDragPos({ x, y });
      }
    } else if (element && selectedDrawingId === element.id) {
      // Start dragging single element
      setIsDragging(element.id);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setLastDragPos({ x, y });
      }
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingAll) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const deltaX = (x - lastDragPos.x) / viewportZoom;
        const deltaY = (y - lastDragPos.y) / viewportZoom;
        
        onMoveAllDrawings(deltaX, deltaY);
        setLastDragPos({ x, y });
      }
    } else if (isDragging) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const deltaX = (x - lastDragPos.x) / viewportZoom;
        const deltaY = (y - lastDragPos.y) / viewportZoom;
        
        onDrawingMove(isDragging, deltaX, deltaY);
        setLastDragPos({ x, y });
      }
    }
  }, [isDragging, isDraggingAll, lastDragPos, viewportZoom, onDrawingMove, onMoveAllDrawings]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
    setIsDraggingAll(false);
  }, []);

  useEffect(() => {
    if (isDragging || isDraggingAll) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isDraggingAll, handleMouseMove, handleMouseUp]);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDrawingDelete(id);
  };

  const renderDrawingElement = (element: DrawingElement) => {
    const isSelected = selectedDrawingId === element.id || isAllSelected || element.isSelected;
    const showInteraction = currentTool === 'select'; // Only show interaction in select mode
    
    return (
      <div
        key={element.id}
        className={`absolute group ${showInteraction ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{
          left: element.x - 10,
          top: element.y - 10,
          width: element.width + 20,
          height: element.height + 20,
          cursor: showInteraction && isSelected ? (isDragging === element.id || isDraggingAll ? 'grabbing' : 'grab') : 'default',
        }}
        onClick={showInteraction ? (e) => handleElementClick(e, element) : undefined}
        onMouseDown={showInteraction ? (e) => handleMouseDown(e, element) : undefined}
        onContextMenu={showInteraction ? (e) => handleContextMenu(e, element) : undefined}
      >
        {/* Invisible interaction area - only active in select mode */}
        {showInteraction && <div className="absolute inset-0 bg-transparent" />}
        
        {/* Selection outline */}
        {isSelected && showInteraction && (
          <div 
            className={`absolute border-2 rounded pointer-events-none ${
              isAllSelected || isMoveMode ? 'border-green-400' : 'border-blue-400'
            }`}
            style={{
              left: 0,
              top: 0,
              width: element.width + 20,
              height: element.height + 20,
            }}
          />
        )}
        
        {/* Hover outline for non-selected elements - only in select mode */}
        {!isSelected && !isMoveMode && showInteraction && (
          <div 
            className="absolute border-2 border-blue-400 rounded opacity-0 group-hover:opacity-30 transition-opacity duration-200 pointer-events-none"
            style={{
              left: 0,
              top: 0,
              width: element.width + 20,
              height: element.height + 20,
            }}
          />
        )}
        
        {/* Selection handles */}
        {isSelected && showInteraction && (
          <div className="absolute pointer-events-none">
            <div 
              className={`absolute w-2 h-2 rounded-full ${
                isAllSelected || isMoveMode ? 'bg-green-400' : 'bg-blue-400'
              }`}
              style={{ left: -1, top: -1 }}
            />
            <div 
              className={`absolute w-2 h-2 rounded-full ${
                isAllSelected || isMoveMode ? 'bg-green-400' : 'bg-blue-400'
              }`}
              style={{ right: -1, top: -1 }}
            />
            <div 
              className={`absolute w-2 h-2 rounded-full ${
                isAllSelected || isMoveMode ? 'bg-green-400' : 'bg-blue-400'
              }`}
              style={{ left: -1, bottom: -1 }}
            />
            <div 
              className={`absolute w-2 h-2 rounded-full ${
                isAllSelected || isMoveMode ? 'bg-green-400' : 'bg-blue-400'
              }`}
              style={{ right: -1, bottom: -1 }}
            />
          </div>
        )}
        
        {/* Delete button - only for individual selection */}
        {isSelected && !isAllSelected && !isMoveMode && showInteraction && (
          <button
            className="absolute w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 pointer-events-auto shadow-lg hover:scale-110"
            style={{ right: -8, top: -8 }}
            onClick={(e) => handleDeleteClick(e, element.id)}
            title="Delete drawing"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <div 
        ref={containerRef}
        className="absolute inset-0 pointer-events-none z-15"
        style={{
          transform: `translate(${viewportX}px, ${viewportY}px) scale(${viewportZoom})`,
          transformOrigin: '0 0'
        }}
        onMouseDown={(e) => {
          // Handle clicking on empty space when all selected or in move mode
          if (currentTool === 'select' && (isAllSelected || isMoveMode) && e.target === e.currentTarget) {
            handleMouseDown(e as any);
          }
        }}
        onContextMenu={(e) => {
          if (currentTool === 'select') {
            handleContextMenu(e);
          }
        }}
      >
        {drawingElements.map(renderDrawingElement)}
        
        {/* Instructions for move mode or select all */}
        {(isAllSelected || isMoveMode) && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm z-50 pointer-events-none">
            {isAllSelected ? 'All drawings selected - Drag anywhere to move all' : 'Move mode active - Drag anywhere to move entire drawing'}
          </div>
        )}
      </div>

      {/* 🎉 MAGICAL CONTEXT MENU! 🎉 */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onDuplicate={() => onDuplicateSelected?.()}
          onFlipHorizontal={() => onFlipSelected?.('horizontal')}
          onFlipVertical={() => onFlipSelected?.('vertical')}
          onChangeColor={() => onChangeColorOfSelected?.(getRandomColor())}
          onScaleUp={() => onScaleSelected?.(1.5)}
          onScaleDown={() => onScaleSelected?.(0.75)}
          onMagicOrganize={() => onMagicOrganize?.()}
          onAutoGroup={() => onAutoGroup?.()}
          onSmoothStrokes={() => onSmoothStrokes?.()}
        />
      )}
    </>
  );
}; 