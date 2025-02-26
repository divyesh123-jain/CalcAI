// components/LatexDisplay.tsx
"use client";
import React from "react";
import Draggable from "react-draggable";

interface Point {
  x: number;
  y: number;
}

interface LatexDisplayProps {
  latexExpression: string[];
  latexPosition: Point;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLatexDrag: (index: number, e: any, ui: any) => void;
  onEraseLatex: (index: number) => void;
}

const LatexDisplay: React.FC<LatexDisplayProps> = ({ latexExpression, latexPosition, onLatexDrag, onEraseLatex }) => {
  return (
    <>
      {latexExpression.map((latex, index) => (
        <Draggable
          key={index}
          defaultPosition={{ x: latexPosition.x, y: latexPosition.y }}
          onStop={(e, data) => onLatexDrag(index, e, data)}
        >
          <div
            className="absolute p-2 text-white rounded shadow-md"
            onClick={() => onEraseLatex(index)}
          >
            <div
              className="latex-content"
              dangerouslySetInnerHTML={{
                __html: `\\(${latex}\\)`,
              }}
            />
          </div>
        </Draggable>
      ))}
    </>
  );
};

export default LatexDisplay;