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