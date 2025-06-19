"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TextElement, TextStyle } from '../lib/types';

interface TextEditorProps {
  textElement: TextElement;
  textStyle: TextStyle;
  onTextChange: (id: string, text: string) => void;
  onFinishEditing: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  viewportZoom: number;
  viewportX: number;
  viewportY: number;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  textElement,
  textStyle,
  onTextChange,
  onFinishEditing,
  onPositionChange,
  viewportZoom,
  viewportX,
  viewportY
}) => {
  const [text, setText] = useState(textElement.text);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [text, adjustTextareaHeight]);

  useEffect(() => {
    // Focus and select all text when editing starts
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    onTextChange(textElement.id, newText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onFinishEditing(textElement.id);
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      onFinishEditing(textElement.id);
    }
    // Prevent canvas shortcuts while editing
    e.stopPropagation();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
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
    }
  }, [isDragging, dragOffset, textElement.id, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
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

  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const editorStyle: React.CSSProperties = {
    position: 'absolute',
    left: textElement.x,
    top: textElement.y,
    zIndex: 1000,
    transform: `rotate(${textElement.rotation}deg)`,
    fontFamily: textStyle.fontFamily,
    fontSize: `${textStyle.fontSize}px`,
    color: hexToRgba(textStyle.color, textStyle.opacity),
    fontWeight: textStyle.fontWeight,
    fontStyle: textStyle.fontStyle,
    textAlign: textStyle.textAlign,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const textareaStyle: React.CSSProperties = {
    background: 'transparent',
    border: '2px dashed rgba(59, 130, 246, 0.5)',
    outline: 'none',
    resize: 'none',
    overflow: 'hidden',
    minWidth: '100px',
    minHeight: `${textStyle.fontSize * 1.2}px`,
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'text',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    color: 'inherit',
    fontWeight: 'inherit',
    fontStyle: 'inherit',
    textAlign: 'inherit',
    lineHeight: '1.2',
    whiteSpace: 'pre-wrap',
  };

  return (
    <div
      ref={containerRef}
      style={editorStyle}
      onMouseDown={handleMouseDown}
      className="select-none"
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        style={textareaStyle}
        placeholder="Type your text..."
        className="focus:border-blue-400 transition-colors duration-200"
        onMouseDown={(e) => e.stopPropagation()}
      />
      
      {/* Resize handles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-400 rounded-full opacity-75"></div>
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full opacity-75"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-400 rounded-full opacity-75"></div>
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-400 rounded-full opacity-75"></div>
      </div>

      {/* Instructions */}
      <div className="absolute -bottom-8 left-0 text-xs text-gray-400 whitespace-nowrap bg-black/50 px-2 py-1 rounded">
        Ctrl+Enter to finish • Escape to cancel • Drag to move
      </div>
    </div>
  );
}; 