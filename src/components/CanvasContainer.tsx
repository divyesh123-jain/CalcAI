import { BsPenFill } from "react-icons/bs";
interface CanvasContainerProps {
    setColor: (color: string) => void;
    selectedColor: string;
  }
  
  export default function CanvasContainer({ setColor, selectedColor }: CanvasContainerProps) {
    const colors: string[] = ["tomato", "lightseagreen", "white", "grey", "hotpink", "red"];
    
    return (
      <div 
        className="absolute bg-indigo-500/50  left-4 rounded-xl top-1/2 -translate-y-1/2 flex flex-col shadow-indigo-500/50 shadow-2xl items-center gap-2 p-4 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <BsPenFill className="text-black my-2" />
        {colors.map((color) => (
          <div
            key={color}
            onClick={() => setColor(color)}
            style={{ backgroundColor: color }}
            className={`cursor-pointer ${
              selectedColor === color ? "border-2 border-black" : ""
            } hover:scale-110 rounded-md h-5 w-5`}
          ></div>
        ))}
      </div>
    );
  }