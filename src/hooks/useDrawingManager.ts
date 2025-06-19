"use client";
import { useState, useCallback } from 'react';
import { DrawingElement, Point, BrushType, BoundingBox } from '../lib/types';

interface UseDrawingManagerReturn {
  drawingElements: DrawingElement[];
  selectedDrawingId: string | null;
  currentStroke: Point[];
  isDrawing: boolean;
  isAllSelected: boolean;
  isMoveMode: boolean;
  addDrawingElement: (points: Point[], color: string, brushType: BrushType, lineWidth: number, opacity: number) => void;
  updateDrawingElement: (id: string, updates: Partial<DrawingElement>) => void;
  deleteDrawingElement: (id: string) => void;
  selectDrawingElement: (id: string | null) => void;
  selectAllDrawings: () => void;
  deselectAll: () => void;
  moveDrawingElement: (id: string, deltaX: number, deltaY: number) => void;
  moveAllDrawings: (deltaX: number, deltaY: number) => void;
  setMoveMode: (enabled: boolean) => void;
  clearAllDrawings: () => void;
  getDrawingElementById: (id: string) => DrawingElement | undefined;
  deleteSelectedDrawing: () => void;
  startStroke: (point: Point) => void;
  addPointToStroke: (point: Point) => void;
  finishStroke: (color: string, brushType: BrushType, lineWidth: number, opacity: number) => void;
  cancelStroke: () => void;
  getElementAtPoint: (x: number, y: number) => DrawingElement | null;
  magicOrganize: () => void;
  autoGroup: () => void;
  duplicateSelected: () => void;
  flipSelected: (direction: 'horizontal' | 'vertical') => void;
  smoothStrokes: () => void;
  changeColorOfSelected: (color: string) => void;
  scaleSelected: (factor: number) => void;
}

export const useDrawingManager = (): UseDrawingManagerReturn => {
  const [drawingElements, setDrawingElements] = useState<DrawingElement[]>([]);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isMoveMode, setIsMoveMode] = useState(false);

  const generateId = () => `drawing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Enhanced stroke smoothing algorithm
  const smoothPoints = (points: Point[]): Point[] => {
    if (points.length < 3) return points;
    
    const smoothed = [points[0]];
    
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      // Catmull-Rom spline smoothing
      const smoothedPoint = {
        x: (prev.x + 2 * curr.x + next.x) / 4,
        y: (prev.y + 2 * curr.y + next.y) / 4
      };
      
      smoothed.push(smoothedPoint);
    }
    
    smoothed.push(points[points.length - 1]);
    return smoothed;
  };

  const calculateBoundingBox = (points: Point[]): BoundingBox => {
    if (points.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  };

  const addDrawingElement = useCallback((
    points: Point[], 
    color: string, 
    brushType: BrushType, 
    lineWidth: number, 
    opacity: number
  ) => {
    if (points.length < 2) return;

    // 🎨 SURPRISE: Auto-smooth all strokes!
    const smoothedPoints = smoothPoints(points);
    const boundingBox = calculateBoundingBox(smoothedPoints);
    
    const newElement: DrawingElement = {
      id: generateId(),
      type: 'stroke',
      points: smoothedPoints,
      color,
      brushType,
      lineWidth,
      opacity,
      x: boundingBox.x,
      y: boundingBox.y,
      width: boundingBox.width,
      height: boundingBox.height,
      rotation: 0,
      isSelected: false,
    };

    setDrawingElements(prev => [...prev, newElement]);
    return newElement.id;
  }, []);

  const updateDrawingElement = useCallback((id: string, updates: Partial<DrawingElement>) => {
    setDrawingElements(prev => 
      prev.map(element => 
        element.id === id 
          ? { ...element, ...updates }
          : element
      )
    );
  }, []);

  const deleteDrawingElement = useCallback((id: string) => {
    setDrawingElements(prev => prev.filter(element => element.id !== id));
    if (selectedDrawingId === id) {
      setSelectedDrawingId(null);
    }
  }, [selectedDrawingId]);

  const selectDrawingElement = useCallback((id: string | null) => {
    // Deselect all elements first
    setDrawingElements(prev => 
      prev.map(element => ({ ...element, isSelected: false }))
    );
    
    // Select the new element
    if (id) {
      setDrawingElements(prev => 
        prev.map(element => 
          element.id === id 
            ? { ...element, isSelected: true }
            : element
        )
      );
    }
    
    setSelectedDrawingId(id);
  }, []);

  const selectAllDrawings = useCallback(() => {
    setDrawingElements(prev => prev.map(element => ({ ...element, isSelected: true })));
    setIsAllSelected(true);
  }, []);

  const deselectAll = useCallback(() => {
    setDrawingElements(prev => prev.map(element => ({ ...element, isSelected: false })));
    setIsAllSelected(false);
  }, []);

  const moveDrawingElement = useCallback((id: string, deltaX: number, deltaY: number) => {
    setDrawingElements(prev => 
      prev.map(element => {
        if (element.id === id) {
          // Move all points by the delta
          const newPoints = element.points.map(point => ({
            x: point.x + deltaX,
            y: point.y + deltaY
          }));
          
          return {
            ...element,
            points: newPoints,
            x: element.x + deltaX,
            y: element.y + deltaY
          };
        }
        return element;
      })
    );
  }, []);

  const moveAllDrawings = useCallback((deltaX: number, deltaY: number) => {
    setDrawingElements(prev => prev.map(element => ({
      ...element,
      x: element.x + deltaX,
      y: element.y + deltaY
    })));
  }, []);

  const deleteSelectedDrawing = useCallback(() => {
    if (selectedDrawingId) {
      deleteDrawingElement(selectedDrawingId);
    }
  }, [selectedDrawingId, deleteDrawingElement]);

  const clearAllDrawings = useCallback(() => {
    setDrawingElements([]);
    setSelectedDrawingId(null);
    setCurrentStroke([]);
    setIsDrawing(false);
    setIsAllSelected(false);
  }, []);

  const getDrawingElementById = useCallback((id: string) => {
    return drawingElements.find(element => element.id === id);
  }, [drawingElements]);

  // Stroke management for current drawing
  const startStroke = useCallback((point: Point) => {
    setCurrentStroke([point]);
    setIsDrawing(true);
  }, []);

  const addPointToStroke = useCallback((point: Point) => {
    setCurrentStroke(prev => [...prev, point]);
  }, []);

  const finishStroke = useCallback((
    color: string, 
    brushType: BrushType, 
    lineWidth: number, 
    opacity: number
  ) => {
    if (currentStroke.length >= 2) {
      addDrawingElement(currentStroke, color, brushType, lineWidth, opacity);
    }
    setCurrentStroke([]);
    setIsDrawing(false);
  }, [currentStroke, addDrawingElement]);

  const cancelStroke = useCallback(() => {
    setCurrentStroke([]);
    setIsDrawing(false);
  }, []);

  // Hit testing - check if a point is inside a drawing element
  const getElementAtPoint = useCallback((x: number, y: number): DrawingElement | null => {
    // Check elements in reverse order (top to bottom)
    for (let i = drawingElements.length - 1; i >= 0; i--) {
      const element = drawingElements[i];
      
      // Simple bounding box hit test first
      if (x >= element.x && x <= element.x + element.width &&
          y >= element.y && y <= element.y + element.height) {
        
        // More precise hit test - check if point is near the stroke
        for (let j = 0; j < element.points.length - 1; j++) {
          const p1 = element.points[j];
          const p2 = element.points[j + 1];
          
          // Calculate distance from point to line segment
          const distance = distancePointToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y);
          
          // Hit if within stroke width + some tolerance
          if (distance <= element.lineWidth / 2 + 5) {
            return element;
          }
        }
      }
    }
    return null;
  }, [drawingElements]);

  const setMoveMode = useCallback((enabled: boolean) => {
    setIsMoveMode(enabled);
  }, []);

  // 🎉 AMAZING SURPRISE FEATURES! 🎉

  // Magic Organize - Automatically arranges drawings in a grid
  const magicOrganize = useCallback(() => {
    if (drawingElements.length === 0) return;
    
    const cols = Math.ceil(Math.sqrt(drawingElements.length));
    const spacing = 150;
    let row = 0, col = 0;
    
    setDrawingElements(prev => prev.map((element, index) => {
      const newX = col * spacing;
      const newY = row * spacing;
      
      const deltaX = newX - element.x;
      const deltaY = newY - element.y;
      
      col++;
      if (col >= cols) {
        col = 0;
        row++;
      }
      
      return {
        ...element,
        x: newX,
        y: newY,
        points: element.points.map(point => ({
          x: point.x + deltaX,
          y: point.y + deltaY
        }))
      };
    }));
  }, [drawingElements]);

  // Auto Group - Groups nearby drawings automatically
  const autoGroup = useCallback(() => {
    const groupDistance = 100;
    const groups: DrawingElement[][] = [];
    const ungrouped = [...drawingElements];
    
    while (ungrouped.length > 0) {
      const current = ungrouped.shift()!;
      const group = [current];
      
      for (let i = ungrouped.length - 1; i >= 0; i--) {
        const other = ungrouped[i];
        const distance = Math.sqrt(
          Math.pow(current.x - other.x, 2) + Math.pow(current.y - other.y, 2)
        );
        
        if (distance < groupDistance) {
          group.push(ungrouped.splice(i, 1)[0]);
        }
      }
      
      groups.push(group);
    }
    
    // Move each group to be tightly packed
    groups.forEach((group, groupIndex) => {
      const offsetX = groupIndex * 200;
      const offsetY = 0;
      
      group.forEach(element => {
        const deltaX = offsetX - element.x;
        const deltaY = offsetY - element.y;
        
        element.x = offsetX;
        element.y = offsetY;
        element.points = element.points.map(point => ({
          x: point.x + deltaX,
          y: point.y + deltaY
        }));
      });
    });
    
    setDrawingElements([...drawingElements]);
  }, [drawingElements]);

  // Duplicate Selected - Creates a copy of selected drawing
  const duplicateSelected = useCallback(() => {
    if (!selectedDrawingId) return;
    
    const element = drawingElements.find(el => el.id === selectedDrawingId);
    if (!element) return;
    
    const duplicate: DrawingElement = {
      ...element,
      id: generateId(),
      x: element.x + 50,
      y: element.y + 50,
      points: element.points.map(point => ({
        x: point.x + 50,
        y: point.y + 50
      })),
      isSelected: false
    };
    
    setDrawingElements(prev => [...prev, duplicate]);
  }, [selectedDrawingId, drawingElements]);

  // Flip Selected - Flips the selected drawing
  const flipSelected = useCallback((direction: 'horizontal' | 'vertical') => {
    if (!selectedDrawingId) return;
    
    setDrawingElements(prev => prev.map(element => {
      if (element.id !== selectedDrawingId) return element;
      
      const centerX = element.x + element.width / 2;
      const centerY = element.y + element.height / 2;
      
      const flippedPoints = element.points.map(point => ({
        x: direction === 'horizontal' ? 2 * centerX - point.x : point.x,
        y: direction === 'vertical' ? 2 * centerY - point.y : point.y
      }));
      
      return { ...element, points: flippedPoints };
    }));
  }, [selectedDrawingId]);

  // Smooth Strokes - Applies extra smoothing to all drawings
  const smoothStrokes = useCallback(() => {
    setDrawingElements(prev => prev.map(element => ({
      ...element,
      points: smoothPoints(element.points)
    })));
  }, []);

  // Change Color of Selected
  const changeColorOfSelected = useCallback((color: string) => {
    if (!selectedDrawingId) return;
    
    setDrawingElements(prev => prev.map(element =>
      element.id === selectedDrawingId ? { ...element, color } : element
    ));
  }, [selectedDrawingId]);

  // Scale Selected
  const scaleSelected = useCallback((factor: number) => {
    if (!selectedDrawingId) return;
    
    setDrawingElements(prev => prev.map(element => {
      if (element.id !== selectedDrawingId) return element;
      
      const centerX = element.x + element.width / 2;
      const centerY = element.y + element.height / 2;
      
      const scaledPoints = element.points.map(point => ({
        x: centerX + (point.x - centerX) * factor,
        y: centerY + (point.y - centerY) * factor
      }));
      
      const newBounds = calculateBoundingBox(scaledPoints);
      
      return {
        ...element,
        points: scaledPoints,
        x: newBounds.x,
        y: newBounds.y,
        width: newBounds.width,
        height: newBounds.height
      };
    }));
  }, [selectedDrawingId]);

  return {
    drawingElements,
    selectedDrawingId,
    currentStroke,
    isDrawing,
    isAllSelected,
    isMoveMode,
    addDrawingElement,
    updateDrawingElement,
    deleteDrawingElement,
    selectDrawingElement,
    selectAllDrawings,
    deselectAll,
    moveDrawingElement,
    moveAllDrawings,
    setMoveMode,
    clearAllDrawings,
    getDrawingElementById,
    deleteSelectedDrawing,
    startStroke,
    addPointToStroke,
    finishStroke,
    cancelStroke,
    getElementAtPoint,
    magicOrganize,
    autoGroup,
    duplicateSelected,
    flipSelected,
    smoothStrokes,
    changeColorOfSelected,
    scaleSelected,
  };
};

// Helper function to calculate distance from point to line segment
function distancePointToLineSegment(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  let param = -1;
  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx: number, yy: number;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
} 