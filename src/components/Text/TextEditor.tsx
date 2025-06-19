"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TextElement, TextStyle } from '../../lib/types';
import { Trash2, RotateCw } from 'lucide-react';

interface TextEditorProps {
  textElement: TextElement;
  textStyle: TextStyle;
  onTextChange: (id: string, text: string) => void;
  onFinishEditing: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onRotationChange: (id: string, rotation: number) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  viewportZoom?: number;
  onSelect: () => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  textElement,
  textStyle,
  onTextChange,
  onFinishEditing,
  onPositionChange,
  onRotationChange,
  onDelete,
  isSelected,
  viewportZoom = 1,
  onSelect
}) => {
  const [text, setText] = useState(textElement.text);
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(!textElement.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
      textarea.style.width = 'auto';
      textarea.style.width = `${Math.max(100, textarea.scrollWidth)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [text, adjustTextareaHeight]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    onTextChange(textElement.id, newText);
    adjustTextareaHeight();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      onFinishEditing(textElement.id);
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      setIsEditing(false);
      onFinishEditing(textElement.id);
    }
    e.stopPropagation();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const handleSingleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only handle left click
    
    // Don't interfere with textarea editing
    if (isEditing && (e.target as HTMLElement).tagName === 'TEXTAREA') {
      return;
    }
    
    // Select this text element
    onSelect();
    
    if ((e.target as HTMLElement).classList.contains('rotation-handle')) {
      setIsRotating(true);
      e.preventDefault();
      return;
    }

    if (containerRef.current && !isEditing) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - textElement.x,
        y: e.clientY - textElement.y
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      onPositionChange(textElement.id, newX, newY);
    } else if (isRotating && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const degrees = (angle * 180) / Math.PI;
      onRotationChange(textElement.id, degrees);
    }
  }, [isDragging, isRotating, dragOffset, textElement.id, onPositionChange, onRotationChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsRotating(false);
  }, []);

  useEffect(() => {
    if (isDragging || isRotating) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isRotating, handleMouseMove, handleMouseUp]);

  const handleBlur = () => {
    if (text.trim() === '') {
      onDelete(textElement.id);
    } else {
      setIsEditing(false);
      onFinishEditing(textElement.id);
    }
  };

  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  return (
    <div
      ref={containerRef}
      className={`absolute select-none text-element ${isSelected ? 'z-10' : ''}`}
      style={{
        left: textElement.x,
        top: textElement.y,
        transform: `rotate(${textElement.rotation}deg)`,
        transformOrigin: 'center center',
      }}
      onMouseDown={handleMouseDown}
      onClick={handleSingleClick}
      onDoubleClick={handleDoubleClick}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={!isEditing}
        spellCheck={false}
        className={`
          bg-transparent outline-none resize-none overflow-hidden
          transition-all duration-200 ease-out
          ${isEditing ? 'border-2 border-dashed border-blue-400/50 bg-gray-900/10' : 'border-none'}
          ${isSelected && !isEditing ? 'ring-1 ring-blue-400/30' : ''}
          rounded-md p-2
        `}
        style={{
          fontFamily: textStyle.fontFamily,
          fontSize: `${textStyle.fontSize * viewportZoom}px`,
          color: hexToRgba(textStyle.color, textStyle.opacity),
          fontWeight: textStyle.fontWeight,
          fontStyle: textStyle.fontStyle,
          textAlign: textStyle.textAlign,
          cursor: isEditing ? 'text' : isDragging ? 'grabbing' : 'grab',
          minWidth: '100px',
          minHeight: `${textStyle.fontSize * 1.2}px`,
          pointerEvents: isEditing ? 'auto' : 'none',
        }}
        placeholder="Type your text..."
      />

      {isSelected && !isEditing && (
        <>
          {/* Selection Border */}
          <div className="absolute inset-0 pointer-events-none border border-blue-400/50 rounded-md">
            {/* Corner handles */}
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-400 rounded-full" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-400 rounded-full" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-400 rounded-full" />
          </div>
            
          {/* Rotation Handle */}
          <div 
            className="rotation-handle absolute -top-6 left-1/2 transform -translate-x-1/2 w-4 h-4 
                       bg-blue-400 rounded-full cursor-pointer flex items-center justify-center
                       hover:bg-blue-500 transition-colors duration-150 border-2 border-white"
          >
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(textElement.id);
            }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 
                       rounded-full flex items-center justify-center transition-colors duration-150
                       text-white shadow-md border border-white"
          >
            <span className="text-xs">×</span>
          </button>
        </>
      )}
    </div>
  );
}; 