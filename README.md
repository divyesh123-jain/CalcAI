# CalcAI

**AI-Powered Mathematical Expression Solver**

Transform handwritten mathematical expressions into digital solutions with advanced AI. From algebra to calculus, get instant answers with step-by-step explanations.

![CalcAI](https://img.shields.io/badge/AI-Powered-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

## 🚀 Features

### 🎨 Advanced Canvas Interface
- **Infinite Canvas**: Zoom and pan across unlimited workspace
- **Smart Drawing Tools**: Pen, eraser with pressure sensitivity
- **Interactive Minimap**: Navigate large canvases with ease
- **Grid System**: Precision drawing with intelligent grid overlay
- **Undo/Redo**: Complete drawing history management

### 🧠 AI-Powered Math Solving
- **Handwriting Recognition**: Convert drawn equations to digital format
- **Step-by-Step Solutions**: Detailed explanations for every calculation
- **Multiple Expression Types**: 
  - Basic arithmetic (`2 + 3 * 4`)
  - Algebraic equations (`2x + 3 = 7`)
  - Complex mathematical expressions
- **Variable Assignment**: Track and solve for multiple variables

### 🎛️ Professional Tools
- **Dynamic Toolbar**: Context-aware tool switching
- **Color System**: Customizable drawing colors
- **Keyboard Shortcuts**: Efficient workflow navigation
- **Real-time Results**: Instant mathematical analysis
- **MathJax Integration**: Beautiful mathematical notation rendering

### 🎯 User Experience
- **Responsive Design**: Works seamlessly on desktop and tablet
- **Modern UI**: Glass-morphism design with smooth animations
- **Loading States**: Visual feedback during AI processing
- **Error Handling**: Graceful failure management

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Lucide React** - Modern icon system

### AI & Processing
- **Google Gemini AI** - Mathematical expression analysis
- **Canvas API** - Advanced drawing capabilities
- **Axios** - HTTP client for API communication

### UI Components
- **Radix UI** - Accessible component primitives
- **Custom Components** - Purpose-built interface elements
- **MathJax** - Mathematical notation rendering

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/calcai.git
cd calcai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

## 🔑 Environment Setup

Create a `.env.local` file with your API keys:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### Getting API Keys

1. **Google Gemini API**:
   - Visit [Google AI Studio](https://aistudio.google.com/)
   - Create a new project and generate an API key
   - Add the key to your environment variables

## 🚀 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## 🎮 Usage

### Basic Workflow
1. **Draw** mathematical expressions on the infinite canvas
2. **Calculate** using the AI-powered analysis button
3. **Review** step-by-step solutions in the results panel
4. **Navigate** using pan/zoom tools or minimap

### Keyboard Shortcuts
- `Space + Drag` - Pan the canvas
- `Ctrl/Cmd + Z` - Undo last action
- `Ctrl/Cmd + Y` - Redo action
- `H` - Hand tool (pan mode)
- `D` - Draw tool
- `E` - Eraser tool

### Drawing Tools
- **Pen Tool**: Draw mathematical expressions
- **Eraser Tool**: Remove unwanted marks
- **Hand Tool**: Navigate the canvas
- **Zoom Controls**: Adjust viewport scale

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/calculate/     # AI processing endpoint
│   ├── calculator/        # Main calculator page
│   └── landing/          # Landing page
├── components/
│   ├── Dashboard/        # Main application interface
│   ├── CanvasArea.tsx    # Drawing canvas logic
│   ├── ToolBar.tsx       # Tool selection interface
│   ├── Minimap.tsx       # Canvas navigation
│   └── ResultDisplay.tsx # Solution presentation
└── lib/
    ├── types.ts          # TypeScript definitions
    └── analyzeImage.ts   # AI integration utilities
```

## 🔮 AI Integration

CalcAI uses Google's Gemini AI model for mathematical expression analysis:

- **Image Processing**: Canvas drawings converted to base64 images
- **Expression Recognition**: AI identifies mathematical notation
- **Solution Generation**: Step-by-step problem solving
- **Error Handling**: Graceful fallbacks for unclear input

## 🎨 Design System

### Colors
- Primary: Cyan (`#06B6D4`) / Purple (`#8B5CF6`) gradients
- Background: Deep black with subtle transparency
- Accents: White with various opacity levels

### Typography
- Interface: System fonts with Tailwind defaults
- Mathematical: MathJax rendering for proper notation

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Deploy to Vercel
vercel --prod
```

### Manual Deployment
```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Todo

- [ ] Mobile touch gesture support
- [ ] Collaborative drawing features
- [ ] Mathematical graph plotting
- [ ] Export to PDF/PNG
- [ ] Voice input for equations
- [ ] Offline mode capabilities

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for mathematical processing
- **Next.js Team** for the excellent framework
- **Vercel** for deployment platform
- **Tailwind CSS** for styling system

---

**Built with ❤️ by [Your Name]**

*Transform your mathematical thinking with AI-powered precision.*
