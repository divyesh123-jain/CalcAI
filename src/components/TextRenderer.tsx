"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TextElement, TextStyle } from '../lib/types';
import { X } from 'lucide-react';

interface TextRendererProps {
  textElements: TextElement[];
  currentTextStyle: TextStyle;
  onTextClick: (id: string) => void;
  onTextDoubleClick: (id: string) => void;
  onTextPositionChange: (id: string, x: number, y: number) => void;
  onTextDelete: (id: string) => void;
  editingTextId: string | null;
  selectedTextId: string | null;
  viewportZoom: number;
  viewportX: number;
  viewportY: number;
}

export const TextRenderer: React.FC<TextRendererProps> = ({
  textElements,
  currentTextStyle,
  onTextClick,
  onTextDoubleClick,
  onTextPositionChange,
  onTextDelete,
  editingTextId,
  selectedTextId,
  viewportZoom,
  viewportX,
  viewportY
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const getTextStyle = (element: TextElement, isEditing: boolean, isSelected: boolean): React.CSSProperties => {
    return {
      position: 'absolute',
      left: element.x,
      top: element.y,
      fontSize: `${element.fontSize}px`,
      fontFamily: element.fontFamily,
      color: hexToRgba(element.color, element.opacity),
      fontWeight: currentTextStyle.fontWeight,
      fontStyle: currentTextStyle.fontStyle,
      textAlign: currentTextStyle.textAlign,
      transform: `rotate(${element.rotation}deg)`,
      cursor: isDragging === element.id ? 'grabbing' : 'grab',
      userSelect: isEditing ? 'text' : 'none',
      pointerEvents: isEditing ? 'none' : 'auto',
      whiteSpace: 'pre-wrap',
      lineHeight: '1.2',
      minWidth: '20px',
      minHeight: `${element.fontSize * 1.2}px`,
      padding: '4px 8px',
      borderRadius: '4px',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: isEditing ? 0.7 : 1,
      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
      border: isSelected ? '2px solid rgba(59, 130, 246, 0.5)' : 'none',
      outline: isSelected ? '1px solid rgba(59, 130, 246, 0.3)' : 'none',
    };
  };

  const handleMouseDown = (e: React.MouseEvent, element: TextElement) => {
    e.stopPropagation();
    
    // Always select the text element first
    onTextClick(element.id);
    
    // Start dragging
    setIsDragging(element.id);
    
    // Calculate offset from mouse to element position
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = (e.clientX - rect.left - viewportX) / viewportZoom;
      const mouseY = (e.clientY - rect.top - viewportY) / viewportZoom;
      
      setDragOffset({
        x: mouseX - element.x,
        y: mouseY - element.y
      });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = (e.clientX - rect.left - viewportX) / viewportZoom;
        const mouseY = (e.clientY - rect.top - viewportY) / viewportZoom;
        
        const newX = mouseX - dragOffset.x;
        const newY = mouseY - dragOffset.y;
        
        onTextPositionChange(isDragging, newX, newY);
      }
    }
  }, [isDragging, dragOffset, viewportX, viewportY, viewportZoom, onTextPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleDoubleClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onTextDoubleClick(id);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onTextDelete(id);
  };

  // Filter out empty text elements and editing elements
  const visibleTextElements = textElements.filter(element => 
    element.text.trim() !== '' && element.id !== editingTextId
  );

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        transform: `translate(${viewportX}px, ${viewportY}px) scale(${viewportZoom})`,
        transformOrigin: '0 0'
      }}
    >
      {visibleTextElements.map((element) => {
        const isSelected = selectedTextId === element.id;
        
        return (
          <div
            key={element.id}
            style={getTextStyle(element, false, isSelected)}
            onMouseDown={(e) => handleMouseDown(e, element)}
            onDoubleClick={(e) => handleDoubleClick(e, element.id)}
            className="pointer-events-auto group relative"
          >
            {element.text}
            
            {/* Selection outline */}
            {isSelected && (
              <div className="absolute inset-0 border-2 border-blue-400 rounded pointer-events-none" />
            )}
            
            {/* Hover outline for non-selected elements */}
            {!isSelected && (
              <div className="absolute inset-0 border-2 border-blue-400 rounded opacity-0 group-hover:opacity-30 transition-opacity duration-200 pointer-events-none" />
            )}
            
            {/* Selection handles */}
            {isSelected && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-400 rounded-full"></div>
              </div>
            )}
            
            {/* Delete button - appears when selected or hovered */}
            {(isSelected || isDragging === element.id) && (
              <button
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 pointer-events-auto shadow-lg hover:scale-110"
                onClick={(e) => handleDeleteClick(e, element.id)}
                title="Delete text"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            
            {/* Hover delete button for non-selected elements */}
            {!isSelected && !isDragging && (
              <button
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 pointer-events-auto shadow-lg hover:scale-110 opacity-0 group-hover:opacity-100"
                onClick={(e) => handleDeleteClick(e, element.id)}
                title="Delete text"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            
            {/* Instructions tooltip */}
            {isSelected && (
              <div className="absolute -bottom-8 left-0 text-xs text-gray-400 whitespace-nowrap bg-black/50 px-2 py-1 rounded pointer-events-none">
                Double-click to edit • Drag to move • Click X to delete
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}; 