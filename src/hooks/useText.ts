import { useState } from 'react';
import { TextElement, TextStyle } from '@/lib/types';

export const useText = () => {
  const [texts, setTexts] = useState<TextElement[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [textStyle, setTextStyle] = useState<TextStyle>({
    fontFamily: 'Inter, sans-serif',
    fontSize: 24,
    color: '#FFFFFF',
    opacity: 1,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
  });

  const createText = (x: number, y: number) => {
    const newText: TextElement = {
      id: `text_${Date.now()}`,
      text: '',
      x,
      y,
      rotation: 0,
    };
    setTexts(prev => [...prev, newText]);
    setSelectedTextId(newText.id);
  };

  const updateText = (id: string, newText: string) => {
    setTexts(prev => prev.map(t => (t.id === id ? { ...t, text: newText } : t)));
  };

  const deleteText = (id: string) => {
    setTexts(prev => prev.filter(t => t.id !== id));
    if (selectedTextId === id) {
      setSelectedTextId(null);
    }
  };

  const updateTextPosition = (id: string, x: number, y: number) => {
    setTexts(prev => prev.map(t => (t.id === id ? { ...t, x, y } : t)));
  };
  
  const updateTextRotation = (id: string, rotation: number) => {
    setTexts(prev => prev.map(t => (t.id === id ? { ...t, rotation } : t)));
  };

  const finishEditing = (id: string) => {
    const textElement = texts.find(t => t.id === id);
    if (textElement && textElement.text.trim() === '') {
      deleteText(id);
    }
    setSelectedTextId(null);
  };

  return {
    texts,
    selectedTextId,
    textStyle,
    setTexts,
    setSelectedTextId,
    setTextStyle,
    createText,
    updateText,
    deleteText,
    updateTextPosition,
    updateTextRotation,
    finishEditing,
  };
}; 