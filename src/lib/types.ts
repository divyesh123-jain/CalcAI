/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Point {
    x: number;
    y: number;
  }
  
  export interface ViewPort {
    x: number;
    y: number;
    zoom: number;
  }
  
  export interface Response {
    expr: string;
    result: string;
    assign: boolean;
  }
  
  export interface GeneratedResult {
    expression: string;
    answer: string;
  }
  
  export interface CanvasDimensions {
    width: number;
    height: number;
  }
  
  export interface CanvasLayers {
    grid: HTMLCanvasElement | null;
    drawing: HTMLCanvasElement | null;
    temp: HTMLCanvasElement | null;
  }
  
  // MathJax window extension
  declare global {
    interface Window {
      MathJax: any;
    }
  }

  export type BrushType = 'pencil' | 'marker' | 'highlighter';
  export type Tool = 'draw' | 'hand' | 'eraser' | 'text' | 'select';

  // Drawing-related types
  export interface DrawingElement {
    id: string;
    type: 'stroke';
    points: Point[];
    color: string;
    brushType: BrushType;
    lineWidth: number;
    opacity: number;
    x: number; // bounding box x
    y: number; // bounding box y
    width: number; // bounding box width
    height: number; // bounding box height
    rotation: number;
    isSelected?: boolean;
  }

  export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  // Text-related types
  export interface TextElement {
    id: string;
    x: number;
    y: number;
    text: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    opacity: number;
    rotation: number;
    width?: number;
    height?: number;
    isEditing?: boolean;
  }

  export interface TextStyle {
    fontSize: number;
    fontFamily: string;
    color: string;
    opacity: number;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textAlign: 'left' | 'center' | 'right';
  }

  export interface FontOption {
    name: string;
    family: string;
    category: 'serif' | 'sans-serif' | 'monospace' | 'handwriting' | 'display';
  }

  // New types for enhanced UI
  export interface UITheme {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  }

  export interface ToolbarItem {
    id: string;
    icon: React.ComponentType<any>;
    label: string;
    action: () => void;
    isActive?: boolean;
    disabled?: boolean;
    shortcut?: string;
  }

  export interface ColorPalette {
    name: string;
    colors: string[];
  }