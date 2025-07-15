import React from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, X, Calculator } from 'lucide-react';

interface SelectionToolbarProps {
  onSolve: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onClearSelection: () => void;
}

const SelectionToolbar: React.FC<SelectionToolbarProps> = ({ onSolve, onZoomIn, onZoomOut, onClearSelection }) => {
  return (
    <div className="absolute top-2 right-2 z-50 bg-gray-800 p-2 rounded-lg shadow-lg flex items-center space-x-2">
      <Button onClick={onSolve} size="sm" variant="ghost">
        <Calculator className="w-5 h-5 mr-1" />
        Solve
      </Button>
      <Button onClick={onZoomIn} size="sm" variant="ghost">
        <ZoomIn className="w-5 h-5" />
      </Button>
      <Button onClick={onZoomOut} size="sm" variant="ghost">
        <ZoomOut className="w-5 h-5" />
      </Button>
      <Button onClick={onClearSelection} size="sm" variant="ghost">
        <X className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default SelectionToolbar; 