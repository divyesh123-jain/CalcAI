"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Calculator, Sparkles, ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';

// Animated Wave Background
const WaveBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let animationId: number;
    let time = 0;
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw multiple sine waves
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(59, 130, 246, ${0.1 - i * 0.02})`;
        ctx.lineWidth = 2;
        
        for (let x = 0; x < canvas.width; x += 2) {
          const y = canvas.height / 2 + 
            Math.sin((x * 0.005) + (time * 0.01) + (i * 0.5)) * (50 + i * 20) +
            Math.sin((x * 0.008) + (time * 0.015) + (i * 0.3)) * (30 + i * 10);
          
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      
      time++;
      animationId = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => cancelAnimationFrame(animationId);
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-20"
      style={{ zIndex: 1 }}
    />
  );
};

// Elegant Floating Elements
const FloatingMathElements = () => {
  const symbols = ['∫', 'π', '∑', '∂', '∞', 'α', 'β', 'θ'];
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {symbols.map((symbol, i) => (
        <div
          key={i}
          className="absolute text-blue-200/20 text-3xl font-light animate-float-gentle opacity-60"
          style={{
            left: `${15 + i * 10}%`,
            top: `${20 + (i % 3) * 25}%`,
            animationDelay: `${i * 1.5}s`,
            animationDuration: `${8 + i * 2}s`
          }}
        >
          {symbol}
        </div>
      ))}
    </div>
  );
};

// Interactive Demo Canvas
const LiveDemo = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const runDemo = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Simulate handwriting
    setTimeout(() => {
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.font = '20px serif';
      
      // Draw equation step by step
      ctx.fillStyle = '#60a5fa';
      ctx.fillText('x² + 4x - 5 = 0', 30, 50);
      
      setTimeout(() => {
        ctx.fillStyle = '#10b981';
        ctx.fillText('→ x = 1, x = -5', 30, 90);
        
        setTimeout(() => {
          ctx.fillStyle = '#f59e0b';
          ctx.fillText('✓ Solved instantly!', 30, 130);
          setIsPlaying(false);
        }, 1000);
      }, 1500);
    }, 800);
  };
  
  return (
    <div className="relative group">
      <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-blue-400/30 transition-all duration-500">
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full opacity-70"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full opacity-70"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full opacity-70"></div>
          </div>
          <button
            onClick={runDemo}
            disabled={isPlaying}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
          >
            <Play className="w-3 h-3" />
            <span>Demo</span>
          </button>
        </div>
        
        <canvas
          ref={canvasRef}
          width={350}
          height={160}
          className="w-full bg-black/30 rounded-lg border border-gray-600/20"
        />
        
        <div className="mt-3 text-center text-gray-400 text-sm">
          Watch AI solve equations in real-time
        </div>
      </div>
    </div>
  );
};

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap');
        
        @keyframes float-gentle {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
            opacity: 0.3; 
          }
          50% { 
            transform: translateY(-15px) rotate(2deg); 
            opacity: 0.8; 
          }
        }
        
        @keyframes gradient-flow {
          0%, 100% { 
            background-position: 0% 50%; 
          }
          50% { 
            background-position: 100% 50%; 
          }
        }
        
        @keyframes glow-pulse {
          0%, 100% { 
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
          }
          50% { 
            box-shadow: 0 0 50px rgba(59, 130, 246, 0.6);
          }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .animate-float-gentle {
          animation: float-gentle linear infinite;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-flow 3s ease-in-out infinite;
        }
        
        .glow-effect {
          animation: glow-pulse 2s ease-in-out infinite;
        }
        
        .slide-up {
          animation: slide-up 0.8s ease-out;
        }
        
        body {
          font-family: 'Inter', sans-serif;
        }
        
        .fancy-font {
          font-family: 'Playfair Display', serif;
        }
      `}</style>
      
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Animated Background */}
        <WaveBackground />
        
        {/* Floating Elements */}
        <FloatingMathElements />
        
        {/* Elegant Cursor Glow */}
        <div 
          className="fixed pointer-events-none z-10 w-80 h-80 rounded-full opacity-15"
          style={{
            background: `radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(139, 92, 246, 0.2) 50%, transparent 70%)`,
            left: mousePosition.x - 160,
            top: mousePosition.y - 160,
            transition: 'all 0.3s ease-out',
            filter: 'blur(2px)'
          }}
        />
        
        {/* Main Content */}
        <div className="relative z-20 flex items-center justify-center min-h-screen px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
              
              {/* Left Side - Hero Content */}
              <div className="text-center lg:text-left slide-up">
                {/* Badge */}
                <div className="inline-flex items-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-6 py-3 mb-8 glow-effect">
                  <Sparkles className="w-5 h-5 text-blue-400 mr-2" />
                  <span className="text-white font-medium">AI-Powered Mathematical Intelligence</span>
                </div>
                
                {/* Main Heading */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight fancy-font">
                  Calc
                  <span className="gradient-text">AI</span>
                </h1>
                
                {/* Subheading */}
                <h2 className="text-2xl md:text-3xl lg:text-4xl text-gray-300 mb-8 font-light">
                  Write. Solve. Learn.
                  <br />
                  <span className="text-blue-400">Instantly.</span>
                </h2>
                
                {/* Description */}
                <p className="text-xl text-gray-400 mb-12 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Transform handwritten mathematical expressions into digital solutions with our advanced AI. 
                  From algebra to calculus, get instant answers with step-by-step explanations.
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link 
                    href="/calculator"
                    className="group bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-4 rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 glow-effect flex items-center justify-center"
                  >
                    <span>Experience CalcAI</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  
                  <button className="bg-white/5 backdrop-blur-sm border border-white/10 text-white px-10 py-4 rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center">
                    <Play className="w-5 h-5 mr-2" />
                    <span>Watch Demo</span>
                  </button>
                </div>
              </div>
              
              {/* Right Side - Interactive Demo */}
              <div className="flex justify-center lg:justify-end slide-up">
                <div className="relative w-full max-w-sm mx-auto">
                  {/* Decorative Elements */}
                  <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
                  <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl"></div>
                  
                  {/* Demo Component */}
                  <div className="relative z-10">
                    <LiveDemo />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Navigation */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 hidden sm:block">
          <div className="flex items-center space-x-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-8 py-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div className="text-white">
              <div className="font-semibold">CalcAI</div>
              <div className="text-xs text-gray-400">Mathematical Intelligence</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 