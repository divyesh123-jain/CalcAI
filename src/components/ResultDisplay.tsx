// components/ResultsDisplay.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Copy, CheckCircle, X, Calculator, TrendingUp, AlertCircle, BookOpen } from "lucide-react";

interface GeneratedResult {
  expression: string;
  answer: string;
  steps?: string[];
}

interface ResultDisplayProps {
  result: GeneratedResult | null;
}

const ResultsDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (result) {
      setIsVisible(true);
    }
  }, [result]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!result || !isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 z-50">
      <div className={`
        transform transition-all duration-500 ease-out
        ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}
      `}>
        <div className="w-full max-w-md mx-auto sm:w-96 p-4 sm:p-6 rounded-2xl backdrop-blur-lg bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-400/20 shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Calculator className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-white font-semibold text-base sm:text-lg">Calculation Result</h3>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Expression */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-white/70 text-sm font-medium">Expression</span>
            </div>
            <div className="relative group">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 font-mono text-white text-sm sm:text-base">
                {result.expression}
              </div>
              <button
                onClick={() => handleCopy(result.expression)}
                className="absolute top-2 right-2 w-6 h-6 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                {isCopied ? (
                  <CheckCircle className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3 text-white/70" />
                )}
              </button>
            </div>
          </div>

          {/* Steps - Show if available */}
          {result.steps && result.steps.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span className="text-white/70 text-sm font-medium">Solution Steps</span>
              </div>
              <div className="space-y-2">
                {result.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-white/5 border border-white/10">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-300 text-xs font-medium">{index + 1}</span>
                    </div>
                    <div className="text-white/80 text-xs sm:text-sm font-mono">{step}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Answer */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-white/70 text-sm font-medium">Answer</span>
            </div>
            <div className="relative group">
              <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30">
                <div className="text-xl sm:text-2xl font-bold text-emerald-300 font-mono">
                  {result.answer}
                </div>
              </div>
              <button
                onClick={() => handleCopy(result.answer)}
                className="absolute top-3 right-3 w-6 h-6 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                {isCopied ? (
                  <CheckCircle className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3 text-white/70" />
                )}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => handleCopy(`${result.expression} = ${result.answer}`)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Copy className="w-3 h-3" />
              Copy Both
            </button>
            <button
              onClick={handleClose}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 text-sm font-medium transition-all duration-200"
            >
              Dismiss
            </button>
          </div>

          {/* Copy confirmation */}
          {isCopied && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
              <div className="px-3 py-1 rounded-lg bg-green-500 text-white text-sm font-medium">
                Copied to clipboard!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;