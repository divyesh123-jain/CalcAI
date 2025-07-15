"use client";
import React, { useEffect } from "react";
import { Rect, ViewPort } from "@/lib/types";

interface CanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: () => void;
  handleMouseOut: () => void;
  handleWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
  handleContextMenu: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleDoubleClick?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleTouchStart?: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  handleTouchMove?: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  handleTouchEnd?: () => void;
  getCursor: () => string;
  viewport: ViewPort;
  selection: Rect | null;
}

const Canvas: React.FC<CanvasProps> = ({
  canvasRef,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleMouseOut,
  handleWheel,
  handleContextMenu,
  handleDoubleClick,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  getCursor,
  viewport,
  selection,
}) => {
  // Ensure canvas gets focus immediately when mounted/remounted
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.focus();
    }
  }, [canvasRef]);

  const onDoubleClickWrapper = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('Canvas double-click wrapper triggered');
    if (handleDoubleClick) {
      handleDoubleClick(e);
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* SINGLE MAIN CANVAS - All drawing happens here */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseOut={handleMouseOut}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        onDoubleClick={onDoubleClickWrapper}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        tabIndex={0}  // Make canvas focusable
        autoFocus     // Auto-focus the canvas
        style={{ 
          cursor: getCursor(),
          touchAction: 'none', // Prevent default touch behaviors
          outline: 'none'      // Remove focus outline
        }}
      />
      {selection && (
        <div
          className="absolute border-2 border-dashed border-blue-500 pointer-events-none"
          style={{
            left: `${viewport.x + selection.x * viewport.zoom}px`,
            top: `${viewport.y + selection.y * viewport.zoom}px`,
            width: `${selection.width * viewport.zoom}px`,
            height: `${selection.height * viewport.zoom}px`,
          }}
        />
      )}

      {/* Zoom level indicator */}
      <div className="fixed top-6 right-6 px-3 py-2 rounded-lg backdrop-blur-md bg-black/20 border border-white/10 text-white/80 text-sm font-mono z-30">
        {Math.round(viewport.zoom * 100)}%
      </div>
    </div>
  );
};

export default Canvas;
