// import { create } from 'zustand';
// import { mountStoreDevtool } from 'simple-zustand-devtools';

// interface Point {
//   x: number;
//   y: number;
// }

// interface CanvasState {
//   isDrawing: boolean;
//   selectedColor: string;
//   reset: boolean;
//   result: GeneratedResult | null;
//   variable: Record<string, any>;
//   isLoading: boolean;
//   error: string | null;
//   latexPosition: Point;
//   latexExpression: string[];
//   isErasing: boolean;
//   isEraserEnabled: boolean;
//   history: string[];
//   currentStep: number;
//   offset: Point;
//   isPanning: boolean;
//   startPanPoint: Point;
//   scale: number;

//   // Actions
//   setIsDrawing: (value: boolean) => void;
//   setSelectedColor: (color: string) => void;
//   setReset: (value: boolean) => void;
//   setResult: (result: GeneratedResult | null) => void;
//   setError: (error: string | null) => void;
//   setIsLoading: (value: boolean) => void;
//   setLatexPosition: (position: Point) => void;
//   addLatexExpression: (expression: string) => void;
//   removeLatexExpression: (index: number) => void;
//   setIsEraserEnabled: (value: boolean) => void;
//   saveToHistory: (imageData: string) => void;
//   undo: () => void;
//   redo: () => void;
//   resetCanvas: () => void;
//   setOffset: (offset: Point) => void;
//   setIsPanning: (value: boolean) => void;
//   setStartPanPoint: (point: Point) => void;
// }

// export const useCanvasStore = create<CanvasState>()(
//   mountStoredevtools((set, get) => ({
//     isDrawing: false,
//     selectedColor: "tomato",
//     reset: false,
//     result: null,
//     variable: {},
//     isLoading: false,
//     error: null,
//     latexPosition: { x: 10, y: 200 },
//     latexExpression: [],
//     isErasing: false,
//     isEraserEnabled: false,
//     history: [],
//     currentStep: -1,
//     offset: { x: 0, y: 0 },
//     isPanning: false,
//     startPanPoint: { x: 0, y: 0 },
//     scale: 1,

//     setIsDrawing: (value) => set({ isDrawing: value }),
//     setSelectedColor: (color) => set({ selectedColor: color }),
//     setReset: (value) => set({ reset: value }),
//     setResult: (result) => set({ result }),
//     setError: (error) => set({ error }),
//     setIsLoading: (value) => set({ isLoading: value }),
//     setLatexPosition: (position) => set({ latexPosition: position }),
//     addLatexExpression: (expression) => 
//       set((state) => ({ 
//         latexExpression: [...state.latexExpression, expression] 
//       })),
//     removeLatexExpression: (index) =>
//       set((state) => ({
//         latexExpression: state.latexExpression.filter((_, i) => i !== index),
//       })),
//     setIsEraserEnabled: (value) => set({ isEraserEnabled: value }),
    
//     saveToHistory: (imageData) =>
//       set((state) => {
//         const newHistory = state.history.slice(0, state.currentStep + 1);
//         newHistory.push(imageData);
//         return {
//           history: newHistory,
//           currentStep: newHistory.length - 1,
//         };
//       }),

//     undo: () =>
//       set((state) => {
//         if (state.currentStep > 0) {
//           return { currentStep: state.currentStep - 1 };
//         }
//         return state;
//       }),

//     redo: () =>
//       set((state) => {
//         if (state.currentStep < state.history.length - 1) {
//           return { currentStep: state.currentStep + 1 };
//         }
//         return state;
//       }),

//     resetCanvas: () =>
//       set({
//         history: [],
//         currentStep: -1,
//         result: null,
//         error: null,
//         latexExpression: [],
//         variable: {},
//       }),

//     setOffset: (offset) => set({ offset }),
//     setIsPanning: (value) => set({ isPanning }),
//     setStartPanPoint: (point) => set({ startPanPoint: point }),
//   }))
// );