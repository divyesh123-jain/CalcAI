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
  export type Tool = 'draw' | 'hand' | 'eraser' | 'text';

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

  export interface TextElement {
    id: string;
    text: string;
    x: number;
    y: number;
    rotation: number;
  }

  export interface TextStyle {
    fontFamily: string;
    fontSize: number;
    color: string;
    opacity: number;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textAlign: 'left' | 'center' | 'right';
  }

  export interface FontOption {
    name: string;
    family: string;
    category: 'sans-serif' | 'serif' | 'monospace' | 'handwriting' | 'display';
  }