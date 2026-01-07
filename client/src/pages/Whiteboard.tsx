import { useState, useMemo, useRef, useEffect } from 'react';
import * as Y from 'yjs';
import { useParams, Navigate } from 'react-router-dom';
import { useWhiteboard } from '../hooks/useWhiteboard';
import { Canvas } from '../components/Canvas';
import { Toolbar } from '../components/Toolbar';
import type { Tool } from '../components/Toolbar';
import { ShareModal } from '../components/ShareModal';
import { Share, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

export const WhiteboardPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { doc, status } = useWhiteboard(roomId || '');
  const [activeTool, setActiveTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const stageRef = useRef<any>(null);

  // Initialize UndoManager
  const undoManager = useMemo(() => {
    return new Y.UndoManager([doc.getArray('lines'), doc.getArray('images')]);
  }, [doc]);

  if (!roomId) return <Navigate to="/" />;

  const handleUndo = () => undoManager.undo();
  const handleRedo = () => undoManager.redo();

  // --- Image Handling ---

  const addImageToYjs = (src: string, x = 100, y = 100) => {
      const yImages = doc.getArray<Y.Map<any>>('images');
      doc.transact(() => {
          const newImg = new Y.Map();
          newImg.set('id', uuidv4());
          newImg.set('src', src);
          newImg.set('x', x);
          newImg.set('y', y);
          newImg.set('width', 200);
          newImg.set('height', 200);
          yImages.push([newImg]);
      });
      // Switch to select tool so user can move it immediately
      setActiveTool('select');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (f) => {
              if (f.target?.result) {
                  addImageToYjs(f.target.result as string);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  // Paste Handler
  useEffect(() => {
      const handlePaste = (e: ClipboardEvent) => {
          const items = e.clipboardData?.items;
          if (!items) return;

          for (const item of items) {
              if (item.type.indexOf('image') !== -1) {
                  const blob = item.getAsFile();
                  if (blob) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                          if (event.target?.result) {
                              // Center paste roughly (or at mouse pos if we tracked it)
                              // For simplicity, offset slightly
                              addImageToYjs(event.target.result as string, window.innerWidth/2 - 100, window.innerHeight/2 - 100);
                          }
                      };
                      reader.readAsDataURL(blob);
                  }
              }
          }
      };
      
      window.addEventListener('paste', handlePaste);
      return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleExport = () => {
      if (stageRef.current) {
          const uri = stageRef.current.toDataURL();
          const link = document.createElement('a');
          link.download = `whiteboard-${roomId}.png`;
          link.href = uri;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  };

  const handleClear = () => {
      if (window.confirm('Clear entire canvas?')) {
          doc.transact(() => {
              doc.getArray('lines').delete(0, doc.getArray('lines').length);
              doc.getArray('images').delete(0, doc.getArray('images').length);
          });
      }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-40 flex justify-between items-start pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
             <Link to="/" className="p-2 bg-white/80 backdrop-blur rounded-xl text-gray-700 hover:bg-white shadow-sm border border-gray-200 transition-colors">
                <Home size={20} />
             </Link>
             <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm border border-gray-200">
                <h2 className="font-semibold text-gray-700 text-sm">Room: {roomId.slice(0, 8)}...</h2>
             </div>
        </div>

        <div className="flex gap-3 pointer-events-auto">
             <div className="px-3 py-2 bg-white/80 backdrop-blur rounded-xl text-xs font-medium text-gray-500 shadow-sm border border-gray-200 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-amber-500'}`} />
                {status}
            </div>
            
            <button 
                onClick={() => setIsShareModalOpen(true)}
                className="p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-500 transition-colors"
            >
                <Share size={20} />
            </button>
        </div>
      </div>

      <Canvas 
        doc={doc} 
        activeTool={activeTool} 
        color={color}
        strokeWidth={strokeWidth}
        stageRef={stageRef}
      />
      
      <Toolbar 
        activeTool={activeTool} 
        setTool={setActiveTool}
        color={color}
        setColor={setColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        undo={handleUndo} 
        redo={handleRedo}
        onImageUpload={handleImageUpload}
        onExport={handleExport}
        onClear={handleClear}
      />

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        roomId={roomId} 
      />
    </div>
  );
};