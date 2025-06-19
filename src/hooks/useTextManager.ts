"use client";
import { useState, useCallback } from 'react';
import { TextElement, TextStyle } from '../lib/types';

interface UseTextManagerReturn {
  textElements: TextElement[];
  currentTextStyle: TextStyle;
  editingTextId: string | null;
  selectedTextId: string | null;
  isTextPanelVisible: boolean;
  addTextElement: (x: number, y: number) => void;
  updateTextElement: (id: string, updates: Partial<TextElement>) => void;
  deleteTextElement: (id: string) => void;
  startEditing: (id: string) => void;
  finishEditing: (id: string) => void;
  selectTextElement: (id: string | null) => void;
  updateTextStyle: (style: Partial<TextStyle>) => void;
  setTextPanelVisible: (visible: boolean) => void;
  clearAllText: () => void;
  getTextElementById: (id: string) => TextElement | undefined;
  deleteSelectedText: () => void;
}

const DEFAULT_TEXT_STYLE: TextStyle = {
  fontSize: 24,
  fontFamily: 'Inter, sans-serif',
  color: '#ffffff',
  opacity: 1,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'left',
};

export const useTextManager = (): UseTextManagerReturn => {
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [currentTextStyle, setCurrentTextStyle] = useState<TextStyle>(DEFAULT_TEXT_STYLE);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isTextPanelVisible, setIsTextPanelVisible] = useState(false);

  const generateId = () => `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addTextElement = useCallback((x: number, y: number) => {
    const newElement: TextElement = {
      id: generateId(),
      x,
      y,
      text: 'New Text',
      fontSize: currentTextStyle.fontSize,
      fontFamily: currentTextStyle.fontFamily,
      color: currentTextStyle.color,
      opacity: currentTextStyle.opacity,
      rotation: 0,
      isEditing: true,
    };

    setTextElements(prev => [...prev, newElement]);
    setEditingTextId(newElement.id);
    setSelectedTextId(newElement.id);
    return newElement.id;
  }, [currentTextStyle]);

  const updateTextElement = useCallback((id: string, updates: Partial<TextElement>) => {
    setTextElements(prev => 
      prev.map(element => 
        element.id === id 
          ? { ...element, ...updates }
          : element
      )
    );
  }, []);

  const deleteTextElement = useCallback((id: string) => {
    setTextElements(prev => prev.filter(element => element.id !== id));
    if (editingTextId === id) {
      setEditingTextId(null);
    }
    if (selectedTextId === id) {
      setSelectedTextId(null);
    }
  }, [editingTextId, selectedTextId]);

  const startEditing = useCallback((id: string) => {
    setEditingTextId(id);
    setSelectedTextId(id);
    updateTextElement(id, { isEditing: true });
  }, [updateTextElement]);

  const finishEditing = useCallback((id: string) => {
    setEditingTextId(null);
    updateTextElement(id, { isEditing: false });
    
    // Remove empty text elements
    setTextElements(prev => {
      const element = prev.find(el => el.id === id);
      if (element && (!element.text || element.text.trim() === '')) {
        if (selectedTextId === id) {
          setSelectedTextId(null);
        }
        return prev.filter(el => el.id !== id);
      }
      return prev;
    });
  }, [updateTextElement, selectedTextId]);

  const selectTextElement = useCallback((id: string | null) => {
    setSelectedTextId(id);
  }, []);

  const deleteSelectedText = useCallback(() => {
    if (selectedTextId) {
      deleteTextElement(selectedTextId);
    }
  }, [selectedTextId, deleteTextElement]);

  const updateTextStyle = useCallback((style: Partial<TextStyle>) => {
    setCurrentTextStyle(prev => ({ ...prev, ...style }));
    
    // If editing a text element, update its style
    if (editingTextId) {
      updateTextElement(editingTextId, {
        fontSize: style.fontSize ?? currentTextStyle.fontSize,
        fontFamily: style.fontFamily ?? currentTextStyle.fontFamily,
        color: style.color ?? currentTextStyle.color,
        opacity: style.opacity ?? currentTextStyle.opacity,
      });
    }
  }, [editingTextId, updateTextElement, currentTextStyle]);

  const setTextPanelVisible = useCallback((visible: boolean) => {
    setIsTextPanelVisible(visible);
  }, []);

  const clearAllText = useCallback(() => {
    setTextElements([]);
    setEditingTextId(null);
    setSelectedTextId(null);
  }, []);

  const getTextElementById = useCallback((id: string) => {
    return textElements.find(element => element.id === id);
  }, [textElements]);

  return {
    textElements,
    currentTextStyle,
    editingTextId,
    selectedTextId,
    isTextPanelVisible,
    addTextElement,
    updateTextElement,
    deleteTextElement,
    startEditing,
    finishEditing,
    selectTextElement,
    updateTextStyle,
    setTextPanelVisible,
    clearAllText,
    getTextElementById,
    deleteSelectedText,
  };
}; 