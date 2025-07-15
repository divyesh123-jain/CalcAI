import { Point, ViewPort, Stroke, Rect } from './types';

// Constants
export const ZOOM_SENSITIVITY = 0.001;
export const PAN_SENSITIVITY = 1.2;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 5;
export const ZOOM_SPEED = 0.1;
export const DEFAULT_VIEWPORT: ViewPort = { x: 0, y: 0, zoom: 1 };

/**
 * Transforms screen coordinates to world coordinates
 */
export function transformPoint(x: number, y: number, viewport: ViewPort): Point {
  return {
    x: (x - viewport.x) / viewport.zoom,
    y: (y - viewport.y) / viewport.zoom
  };
}

/**
 * Draws a grid on the canvas
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D, 
  viewport: ViewPort,
  gridSize: number = 20
) {
  // Clear canvas with black background
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Draw grid lines
  const dotSpacing = gridSize * viewport.zoom;
  const offsetX = viewport.x % dotSpacing;
  const offsetY = viewport.y % dotSpacing;
  
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  
  for (let i = offsetX; i < ctx.canvas.width; i += dotSpacing) {
    for (let j = offsetY; j < ctx.canvas.height; j += dotSpacing) {
      ctx.beginPath();
      ctx.arc(i, j, 1 * viewport.zoom, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export const getStrokeAsPath = (stroke: Stroke) => {
  if (!stroke.points || stroke.points.length === 0) return '';
  
  const path = stroke.points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      return `L ${p.x} ${p.y}`;
    })
    .join(' ');
    
  return path;
};

export const getStrokesBoundingBox = (strokes: Stroke[]): Rect | null => {
  if (strokes.length === 0) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  strokes.forEach(stroke => {
    stroke.points.forEach(point => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
  });

  if (minX === Infinity) return null;

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};