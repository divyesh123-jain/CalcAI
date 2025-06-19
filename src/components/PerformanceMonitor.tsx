"use client";
import React, { useState, useEffect } from "react";
import { Activity, TrendingUp, Zap, EyeOff } from "lucide-react";

interface PerformanceMonitorProps {
  isDrawing?: boolean;
  zoom?: number;
  canvasSize?: { width: number; height: number };
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isDrawing = false,
  zoom = 1,
  canvasSize = { width: 0, height: 0 }
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [fps, setFps] = useState(60);
  const [frameCount, setFrameCount] = useState(0);
  const [lastTime, setLastTime] = useState(Date.now());
  const [avgFps, setAvgFps] = useState(60);
  const [drawingStrokes, setDrawingStrokes] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);

  useEffect(() => {
    let animationId: number;
    let fpsInterval: NodeJS.Timeout;
    
    const updateFPS = () => {
      setFrameCount(prev => prev + 1);
      if (isVisible) {
        animationId = requestAnimationFrame(updateFPS);
      }
    };
    
    const calculateFPS = () => {
      const now = Date.now();
      const delta = now - lastTime;
      
      if (delta >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / delta);
        setFps(currentFps);
        setAvgFps(prev => Math.round((prev + currentFps) / 2));
        setFrameCount(0);
        setLastTime(now);
      }
    };
    
    if (isVisible) {
      animationId = requestAnimationFrame(updateFPS);
      fpsInterval = setInterval(calculateFPS, 1000); // Calculate FPS every second
    }
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (fpsInterval) {
        clearInterval(fpsInterval);
      }
    };
  }, [isVisible, frameCount, lastTime]);

  useEffect(() => {
    if (isDrawing) {
      setDrawingStrokes(prev => prev + 1);
    }
  }, [isDrawing]);

  useEffect(() => {
    // Only monitor memory usage when visible and less frequently
    if (!isVisible) return;
    
    const memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
        setMemoryUsage(Math.round(memory.usedJSHeapSize / 1048576)); // Convert to MB
      }
    }, 2000); // Check every 2 seconds instead of every frame
    
    return () => clearInterval(memoryInterval);
  }, [isVisible]);

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value >= threshold) return 'text-emerald-400';
    if (value >= threshold * 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-20 right-6 z-30">
        <button
          onClick={() => setIsVisible(true)}
          className="w-10 h-10 rounded-lg bg-black/20 border border-white/10 hover:bg-black/30 transition-all flex items-center justify-center text-white/60 hover:text-white"
          title="Show Performance Monitor"
        >
          <Activity className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-6 z-30">
      <div className="w-72 p-4 rounded-lg backdrop-blur-lg bg-black/30 border border-white/20 shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-white text-sm font-medium">Performance</span>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white/60 hover:text-white"
          >
            <EyeOff className="w-3 h-3" />
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          
          {/* FPS */}
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/60">FPS</span>
              <TrendingUp className="w-3 h-3 text-cyan-400" />
            </div>
            <div className={`text-lg font-mono font-bold ${getPerformanceColor(fps, 50)}`}>
              {fps}
            </div>
            <div className="text-white/40 text-xs">Avg: {avgFps}</div>
          </div>

          {/* Zoom Level */}
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/60">Zoom</span>
              <Zap className="w-3 h-3 text-purple-400" />
            </div>
            <div className="text-lg font-mono font-bold text-purple-300">
              {Math.round(zoom * 100)}%
            </div>
            <div className="text-white/40 text-xs">
              {zoom > 2 ? 'High' : zoom < 0.5 ? 'Low' : 'Normal'}
            </div>
          </div>

          {/* Canvas Size */}
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-white/60 mb-1">Canvas</div>
            <div className="text-sm font-mono text-emerald-300">
              {canvasSize.width}×{canvasSize.height}
            </div>
            <div className="text-white/40 text-xs">
              {Math.round((canvasSize.width * canvasSize.height) / 1000000)}MP
            </div>
          </div>

          {/* Drawing Strokes */}
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-white/60 mb-1">Strokes</div>
            <div className="text-sm font-mono text-yellow-300">
              {drawingStrokes}
            </div>
            <div className="text-white/40 text-xs">
              {isDrawing ? 'Drawing...' : 'Idle'}
            </div>
          </div>

          {/* Memory Usage */}
          {memoryUsage > 0 && (
            <div className="col-span-2 p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/60">Memory Usage</span>
                <span className={`text-sm font-mono ${getPerformanceColor(100 - memoryUsage, 70)}`}>
                  {memoryUsage}MB
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    memoryUsage < 50 ? 'bg-emerald-500' : 
                    memoryUsage < 100 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(memoryUsage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Status Indicators */}
        <div className="mt-3 flex gap-2">
          <div className={`w-2 h-2 rounded-full ${fps > 50 ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
          <span className="text-white/60 text-xs">
            {fps > 50 ? 'Smooth' : fps > 30 ? 'Moderate' : 'Laggy'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor; 