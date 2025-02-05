"use client"
import React, { useEffect, useRef, useState } from "react";
import CanvasContainer from "../CanvasContainer";
import axios from "axios";
import { Button } from "../ui/button";

interface Response{
    expr : string;
    result : string;
    assign : boolean

}

interface GeneratedResult {
    expression : string;
    answer : string;
}

export default function Dashboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState("tomato"); 
  const [reset , setReset] = useState(false);
  const [result , setResult] = useState<GeneratedResult | null>(null);
  const [variable  , setVariable ] = useState({});
  useEffect(() => {
    if(reset){
        resetCanvas()
        setReset(false)
    }
  } , [reset])





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

  const sendData = async () => {
    const canvas = canvasRef.current
    if(canvas){
        const response = await axios(
            {
                method: 'POST',
                // url: `${}`,
                data:{
                    image: canvas.toDataURL('image/png'),
                    variable: variable
                }

            }
        )

        const resp =  response.data
        console.log('response' , resp)
    }

}

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

  const resetCanvas = ()  => {
    const canvas = canvasRef.current;
    if(canvas){
        const ctx = canvas.getContext('2d')
        if(ctx) {
            ctx.clearRect(0 , 0 , canvas.width , canvas.height)

        }
    }
  }
  

  return (
    <>
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
      <div className="absolute bottom-4 left-4 flex space-x-4">
        <Button onClick={sendData}>Calculate</Button>
        <Button onClick={() => setReset(true)}>Reset</Button>
      </div>
    </div>
    </>
  );
}