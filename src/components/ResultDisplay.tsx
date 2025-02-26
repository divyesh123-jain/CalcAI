// components/ResultsDisplay.tsx
"use client";
import React from "react";

interface GeneratedResult {
  expression: string;
  answer: string;
}

interface ResultsDisplayProps {
  result: GeneratedResult | null;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  return (
    <>
      {result && (
        <div className="absolute top-24 right-4 bg-white/10 p-4 rounded-lg backdrop-blur-sm text-white shadow-lg">
          <p>Expression: {result.expression}</p>
          <p>Answer: {result.answer}</p>
        </div>
      )}
    </>
  );
};

export default ResultsDisplay;