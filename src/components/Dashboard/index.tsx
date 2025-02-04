"use client"
import React, { useEffect, useRef, useState } from "react";
import CanvasContainer from "../CanvasContainer";



export default function Dashboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState("tomato"); // Changed default color

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Set initial canvas background
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set initial drawing styles
        ctx.lineCap = "round";
        ctx.lineWidth = 5;
      }
    }

    // Handle window resize
    const handleResize = () => {
      if (canvas) {
        const ctx = canvas.getContext("2d");
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        
        // Save current drawing
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        if (tempCtx && ctx) {
          tempCtx.drawImage(canvas, 0, 0);
          
          // Resize canvas
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          
          // Restore background
          ctx.fillStyle = "black";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Restore drawing
          ctx.drawImage(tempCanvas, 0, 0);
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = selectedColor;
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setIsDrawing(true);
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
      }
    }
  };

  return (
    <div className="relative w-full h-screen bg-black">
      <CanvasContainer setColor={setSelectedColor} selectedColor={selectedColor} />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      />
    </div>
  );
}