import React, { useRef } from 'react';
import { MousePointer2, Pen, Eraser, Image as ImageIcon, Download, Trash2, Hand } from 'lucide-react';

export type Tool = 'select' | 'hand' | 'pen' | 'eraser';

interface ToolbarProps {
  activeTool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  undo: () => void;
  redo: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onClear: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  activeTool, setTool, 
  color, setColor, 
  strokeWidth, setStrokeWidth,
  undo, redo, 
  onImageUpload, onExport, onClear 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tools = [
    { id: 'select', icon: <MousePointer2 size={20} />, label: 'Select' },
    { id: 'hand', icon: <Hand size={20} />, label: 'Pan' },
    { id: 'pen', icon: <Pen size={20} />, label: 'Draw' },
    { id: 'eraser', icon: <Eraser size={20} />, label: 'Eraser' },
  ] as const;

  const colors = [
    '#000000', // Black
    '#dc2626', // Red
    '#16a34a', // Green
    '#2563eb', // Blue
    '#d97706', // Orange
    '#9333ea', // Purple
  ];

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4 z-50">
      
      {/* Secondary Bar (Colors & Actions) - Only show if not selecting (or always show) */}
      <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-gray-200">
        
        {/* Colors */}
        {(activeTool === 'pen' || activeTool === 'eraser') && (
           <div className="flex items-center gap-4 pr-3 border-r border-gray-300">
             {activeTool === 'pen' && (
                 <div className="flex items-center gap-2">
                    {colors.map((c) => (
                    <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-5 h-5 rounded-full border border-gray-200 transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-blue-500' : 'hover:scale-110'}`}
                        style={{ backgroundColor: c }}
                    />
                    ))}
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                 </div>
             )}
             
             <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Size</span>
                <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    value={strokeWidth} 
                    onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                    className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
             </div>
           </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
            <button 
                onClick={() => undo()} 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Undo (Ctrl+Z)"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
            </button>
            <button 
                onClick={() => redo()} 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Redo (Ctrl+Y)"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14l5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13"/></svg>
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />

            <button 
                onClick={() => fileInputRef.current?.click()} 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Upload Image"
            >
                <ImageIcon size={20} />
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={onImageUpload}
            />

            <button 
                onClick={onExport} 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Export as PNG"
            >
                <Download size={20} />
            </button>
            
             <button 
                onClick={onClear} 
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Clear Canvas"
            >
                <Trash2 size={20} />
            </button>
        </div>
      </div>

      {/* Main Tools */}
      <div className="flex items-center gap-1 bg-gray-900 text-white px-2 py-2 rounded-2xl shadow-2xl ring-1 ring-white/10">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setTool(tool.id as Tool)}
            className={`p-3 rounded-xl transition-all duration-200 flex flex-col items-center gap-1 min-w-[60px] ${
              activeTool === tool.id
                ? 'bg-white/20 shadow-inner'
                : 'hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            {tool.icon}
            <span className="text-[10px] font-medium">{tool.label}</span>
          </button>
        ))}
      </div>

    </div>
  );
};