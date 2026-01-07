import React, { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Line, Rect, Image as KonvaImage, Transformer } from 'react-konva';
import * as Y from 'yjs';
import useImage from 'use-image';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useWindowSize } from '../hooks/useWindowSize';
import { v4 as uuidv4 } from 'uuid';
import Konva from 'konva';

// --- Types ---

interface LineData {
  id: string;
  points: number[];
  tool: 'pen' | 'eraser';
  color: string;
  strokeWidth: number;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

interface ImageData {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

interface CanvasProps {
  doc: Y.Doc;
  activeTool: 'select' | 'hand' | 'pen' | 'eraser';
  color: string;
  strokeWidth: number;
  stageRef: React.MutableRefObject<any>;
}

// --- Helper Components ---

const URLImage = ({ image, onSelect, onChange, draggable }: any) => {
  const [img] = useImage(image.src);
  const shapeRef = useRef<any>(null);

  return (
    <KonvaImage
      image={img}
      x={image.x}
      y={image.y}
      width={image.width}
      height={image.height}
      scaleX={image.scaleX || 1}
      scaleY={image.scaleY || 1}
      rotation={image.rotation || 0}
      draggable={draggable}
      id={image.id}
      name="object" // Class name for selection
      ref={shapeRef}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({
          ...image,
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      onTransformEnd={() => {
        const node = shapeRef.current;
        onChange({
          ...image,
          x: node.x(),
          y: node.y(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
          rotation: node.rotation(),
        });
      }}
    />
  );
};

// --- Main Component ---

export const Canvas: React.FC<CanvasProps> = ({ doc, activeTool, color, strokeWidth, stageRef }) => {
  const [lines, setLines] = useState<LineData[]>([]);
  const [images, setImages] = useState<ImageData[]>([]);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionRect, setSelectionRect] = useState<{ x: number, y: number, width: number, height: number, isVisible: boolean }>({
      x: 0, y: 0, width: 0, height: 0, isVisible: false
  });
  
  // Selection Bounding Box (for the mover)
  const [selectionBox, setSelectionBox] = useState<Konva.RectConfig | null>(null);

  // Clipboard
  const clipboardRef = useRef<{ type: 'line' | 'image'; data: any }[]>([]);

  const isDrawing = useRef(false);
  const isSelecting = useRef(false); 
  const selectionStart = useRef<{ x: number, y: number } | null>(null);

  const currentLineRef = useRef<Y.Map<any> | null>(null);
  const { width, height } = useWindowSize();
  
  // Transformer Ref
  const trRef = useRef<any>(null);
  
  // Viewport State
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  // Permissions
  const searchParams = new URLSearchParams(window.location.search);
  const isVisitor = searchParams.get('role') === 'visitor';

  // --- Sync Logic ---

  useEffect(() => {
    const yLines = doc.getArray<Y.Map<any>>('lines');
    const updateLines = () => {
      setLines(yLines.toArray().map((yLine) => ({
        id: yLine.get('id') || 'unknown',
        points: (yLine.get('points') as Y.Array<number>).toArray(),
        tool: yLine.get('tool'),
        color: yLine.get('color'),
        strokeWidth: yLine.get('strokeWidth'),
        x: yLine.get('x') || 0,
        y: yLine.get('y') || 0,
        scaleX: yLine.get('scaleX') || 1,
        scaleY: yLine.get('scaleY') || 1,
        rotation: yLine.get('rotation') || 0,
      })));
    };
    yLines.observeDeep(updateLines);
    updateLines();

    const yImages = doc.getArray<Y.Map<any>>('images');
    const updateImages = () => {
        setImages(yImages.toArray().map(yImg => ({
            id: yImg.get('id'),
            src: yImg.get('src'),
            x: yImg.get('x'),
            y: yImg.get('y'),
            width: yImg.get('width'),
            height: yImg.get('height'),
            scaleX: yImg.get('scaleX') || 1,
            scaleY: yImg.get('scaleY') || 1,
            rotation: yImg.get('rotation') || 0,
        })));
    };
    yImages.observeDeep(updateImages);
    updateImages();

    return () => {
      yLines.unobserveDeep(updateLines);
      yImages.unobserveDeep(updateImages);
    };
  }, [doc]);

  // --- Selection & Transformer ---

  useEffect(() => {
      if (trRef.current && stageRef.current) {
          const stage = stageRef.current;
          const selectedNodes = Array.from(selectedIds).map(id => stage.findOne('#' + id)).filter(Boolean);
          
          if (selectedNodes.length > 0) {
              trRef.current.nodes(selectedNodes);
              const box = trRef.current.getClientRect();
              setSelectionBox(box);
              trRef.current.getLayer().batchDraw();
          } else {
              trRef.current.nodes([]);
              setSelectionBox(null);
          }
      }
  }, [selectedIds, lines, images]); 

  // --- CRUD Helpers ---

  const deleteObject = (id: string) => {
      doc.transact(() => {
          const yLines = doc.getArray<Y.Map<any>>('lines');
          let index = -1;
          const lArr = yLines.toArray();
          for(let i=0; i<lArr.length; i++) {
              if (lArr[i].get('id') === id) { index = i; break; }
          }
          if (index !== -1) {
              yLines.delete(index, 1);
              return;
          }

          const yImages = doc.getArray<Y.Map<any>>('images');
          index = -1;
          const iArr = yImages.toArray();
          for(let i=0; i<iArr.length; i++) {
              if (iArr[i].get('id') === id) { index = i; break; }
          }
          if (index !== -1) {
              yImages.delete(index, 1);
          }
      });
  };

  const updateLine = (id: string, attrs: any) => {
      const yLines = doc.getArray<Y.Map<any>>('lines');
      let index = -1;
      const arr = yLines.toArray();
      for(let i=0; i<arr.length; i++) {
          if (arr[i].get('id') === id) { index = i; break; }
      }
      if (index !== -1) {
          doc.transact(() => {
              const yLine = yLines.get(index);
              for (const [key, value] of Object.entries(attrs)) {
                  yLine.set(key, value);
              }
          });
      }
  };

  const updateImage = (id: string, attrs: any) => {
      const yImages = doc.getArray<Y.Map<any>>('images');
      let index = -1;
      const arr = yImages.toArray();
      for(let i=0; i<arr.length; i++) {
          if (arr[i].get('id') === id) { index = i; break; }
      }
      if (index !== -1) {
          doc.transact(() => {
              const yImg = yImages.get(index);
              for (const [key, value] of Object.entries(attrs)) {
                  yImg.set(key, value);
              }
          });
      }
  };

  // --- Keyboard Shortcuts ---

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (isVisitor) return;

          if (e.key === 'Delete' || e.key === 'Backspace') {
              selectedIds.forEach(id => deleteObject(id));
              setSelectedIds(new Set());
          }

          if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
              const selectedItems: any[] = [];
              selectedIds.forEach(id => {
                  const line = lines.find(l => l.id === id);
                  if (line) {
                      selectedItems.push({ type: 'line', data: line });
                      return;
                  }
                  const img = images.find(i => i.id === id);
                  if (img) {
                      selectedItems.push({ type: 'image', data: img });
                  }
              });
              if (selectedItems.length > 0) clipboardRef.current = selectedItems;
          }

          if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
              if (clipboardRef.current.length > 0) {
                  const offset = 20; 
                  doc.transact(() => {
                      const newIds = new Set<string>();
                      clipboardRef.current.forEach(item => {
                          const { type, data } = item;
                          const newId = uuidv4();
                          if (type === 'line') {
                              const yLines = doc.getArray<Y.Map<any>>('lines');
                              const newLine = new Y.Map();
                              newLine.set('id', newId);
                              newLine.set('tool', data.tool);
                              newLine.set('color', data.color);
                              newLine.set('strokeWidth', data.strokeWidth);
                              newLine.set('x', data.x + offset);
                              newLine.set('y', data.y + offset);
                              newLine.set('scaleX', data.scaleX);
                              newLine.set('scaleY', data.scaleY);
                              newLine.set('rotation', data.rotation);
                              const pArray = new Y.Array();
                              newLine.set('points', pArray);
                              pArray.push(data.points);
                              yLines.push([newLine]);
                          } else if (type === 'image') {
                              const yImages = doc.getArray<Y.Map<any>>('images');
                              const newImg = new Y.Map();
                              newImg.set('id', newId);
                              newImg.set('src', data.src);
                              newImg.set('x', data.x + offset);
                              newImg.set('y', data.y + offset);
                              newImg.set('width', data.width);
                              newImg.set('height', data.height);
                              newImg.set('scaleX', data.scaleX);
                              newImg.set('scaleY', data.scaleY);
                              newImg.set('rotation', data.rotation);
                              yImages.push([newImg]);
                          }
                          newIds.add(newId);
                      });
                      setSelectedIds(newIds);
                  });
              }
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, lines, images, isVisitor, doc]);

  // --- Interaction Handlers ---

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (isVisitor) return;

    const clickedOnEmpty = e.target === e.target.getStage();
    const isCtrl = e.evt.ctrlKey || e.evt.metaKey;

    if (activeTool === 'hand') return;

    if (activeTool === 'select') {
        if (clickedOnEmpty) {
            if (!isCtrl) setSelectedIds(new Set());
            isSelecting.current = true;
            const pos = e.target.getStage()?.getRelativePointerPosition();
            if (pos) {
                selectionStart.current = pos;
                setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0, isVisible: true });
            }
        } else {
             const id = e.target.id();
             if (id) {
                 if (isCtrl) {
                     setSelectedIds(prev => {
                         const next = new Set(prev);
                         if (next.has(id)) next.delete(id);
                         else next.add(id);
                         return next;
                     });
                 } else if (!selectedIds.has(id)) {
                     setSelectedIds(new Set([id]));
                 }
             }
        }
        return;
    }

    if (e.evt.button !== 0) return;
    isDrawing.current = true;
    const pos = e.target.getStage()?.getRelativePointerPosition();
    if (!pos) return;
    setSelectedIds(new Set());
    const yLines = doc.getArray<Y.Map<any>>('lines');
        doc.transact(() => {
            const newLineMap = new Y.Map();
            const pointsArray = new Y.Array();
            pointsArray.push([pos.x, pos.y]);
            
            newLineMap.set('id', uuidv4());
            newLineMap.set('points', pointsArray);
            newLineMap.set('tool', activeTool);
            // Eraser color is irrelevant for destination-out, but we set it for consistency
            newLineMap.set('color', activeTool === 'eraser' ? '#000000' : color);
            newLineMap.set('strokeWidth', strokeWidth);
            newLineMap.set('x', 0);
            newLineMap.set('y', 0);
            
            yLines.push([newLineMap]);
            currentLineRef.current = newLineMap;
        });
      };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (isSelecting.current && selectionStart.current) {
        const pos = e.target.getStage()?.getRelativePointerPosition();
        if (!pos) return;
        setSelectionRect({
            x: Math.min(pos.x, selectionStart.current.x),
            y: Math.min(pos.y, selectionStart.current.y),
            width: Math.abs(pos.x - selectionStart.current.x),
            height: Math.abs(pos.y - selectionStart.current.y),
            isVisible: true
        });
        return;
    }

    if (!isDrawing.current || !currentLineRef.current) return;
    const stage = e.target.getStage();
    const pos = stage?.getRelativePointerPosition();
    if (!pos) return;
    doc.transact(() => {
        const pointsArray = currentLineRef.current?.get('points') as Y.Array<number>;
        if (pointsArray) pointsArray.push([pos.x, pos.y]);
    });
  };

  const handleMouseUp = (e: KonvaEventObject<MouseEvent>) => {
    if (isSelecting.current && selectionRect.isVisible) {
        const stage = e.target.getStage();
        const box = { 
            x: selectionRect.x, 
            y: selectionRect.y, 
            width: selectionRect.width, 
            height: selectionRect.height 
        };
        const selected = new Set(selectedIds);
        [...lines, ...images].forEach(obj => {
             const node = stage?.findOne('#' + obj.id);
             if (node && Konva.Util.haveIntersection(box, node.getClientRect())) {
                 selected.add(obj.id);
             }
        });
        setSelectedIds(selected);
        setSelectionRect(prev => ({ ...prev, isVisible: false }));
        isSelecting.current = false;
        selectionStart.current = null;
    }
    isDrawing.current = false;
    currentLineRef.current = null;
  };

  // --- Group Move Handling ---

  // We track the previous position of the mover rect to calculate deltas during drag
  const lastDragPos = useRef<{ x: number, y: number } | null>(null);

  const handleGroupDragStart = (e: KonvaEventObject<DragEvent>) => {
      lastDragPos.current = { x: e.target.x(), y: e.target.y() };
  };

  const handleGroupDragMove = (e: KonvaEventObject<DragEvent>) => {
      if (!lastDragPos.current) return;

      const newX = e.target.x();
      const newY = e.target.y();
      const dx = newX - lastDragPos.current.x;
      const dy = newY - lastDragPos.current.y;

      // Move all selected nodes visually (without triggering React/Yjs updates yet)
      selectedIds.forEach(id => {
          const node = stageRef.current?.findOne('#' + id);
          if (node) {
              node.x(node.x() + dx);
              node.y(node.y() + dy);
          }
      });

      lastDragPos.current = { x: newX, y: newY };
      
      // Force batch draw to ensure smooth visual update
      stageRef.current?.batchDraw();
  };

  const handleGroupDragEnd = (e: KonvaEventObject<DragEvent>) => {
      // Sync final positions to Yjs
      doc.transact(() => {
          selectedIds.forEach(id => {
              const node = stageRef.current?.findOne('#' + id);
              if (node) {
                  const line = lines.find(l => l.id === id);
                  if (line) {
                      updateLine(id, { x: node.x(), y: node.y() });
                      return;
                  }
                  const img = images.find(i => i.id === id);
                  if (img) {
                      updateImage(id, { x: node.x(), y: node.y() });
                  }
              }
          });
      });

      // Update the selection box position to match the new items location
      const newBox = trRef.current?.getClientRect();
      if (newBox) {
          setSelectionBox(newBox);
          // Reset mover rect position to match the new box
          e.target.position({ x: newBox.x, y: newBox.y });
      }
      
      lastDragPos.current = null;
  };

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const scaleBy = 1.1;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    setStageScale(newScale);
    setStagePos({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
  };

  return (
    <div className={`absolute inset-0 bg-[#e5e7eb] overflow-hidden ${activeTool === 'hand' ? 'cursor-grab active:cursor-grabbing' : ''}`}>
        <Stage
            width={width}
            height={height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePos.x}
            y={stagePos.y}
            ref={stageRef}
            draggable={activeTool === 'hand'}
        >
        <Layer>
            <Rect x={-50000} y={-50000} width={100000} height={100000} fill="#ffffff" />
            
            {images.map((img) => (
                <URLImage
                    key={img.id}
                    image={img}
                    draggable={false} // Disabled in favor of group mover
                    onSelect={() => {}} 
                    onChange={updateImage}
                />
            ))}

            {lines.map((line) => (
            <Line
                key={line.id}
                id={line.id}
                name="object"
                points={line.points}
                stroke={line.color}
                strokeWidth={line.strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation="source-over"
                draggable={false} // Disabled in favor of group mover
                x={line.x}
                y={line.y}
                scaleX={line.scaleX}
                scaleY={line.scaleY}
                rotation={line.rotation}
            />
            ))}

            {selectionRect.isVisible && (
                <Rect
                    fill="rgba(0, 161, 255, 0.2)"
                    stroke="#00a1ff"
                    strokeWidth={1}
                    x={selectionRect.x}
                    y={selectionRect.y}
                    width={selectionRect.width}
                    height={selectionRect.height}
                />
            )}

            {/* Selection Mover Rect (Allows clicking anywhere in the box to move) */}
            {selectionBox && activeTool === 'select' && (
                <Rect
                    x={selectionBox.x}
                    y={selectionBox.y}
                    width={selectionBox.width}
                    height={selectionBox.height}
                    fill="transparent"
                    draggable={!isVisitor}
                    onDragStart={handleGroupDragStart}
                    onDragMove={handleGroupDragMove}
                    onDragEnd={handleGroupDragEnd}
                />
            )}

            <Transformer 
                ref={trRef} 
                rotateEnabled={selectedIds.size === 1} // Rotate only single items for stability
                onTransformEnd={() => {
                    if (selectedIds.size === 1) {
                        const id = Array.from(selectedIds)[0];
                        const node = trRef.current.nodes()[0];
                        const line = lines.find(l => l.id === id);
                        if (line) {
                            updateLine(id, { x: node.x(), y: node.y(), scaleX: node.scaleX(), scaleY: node.scaleY(), rotation: node.rotation() });
                        } else {
                            updateImage(id, { x: node.x(), y: node.y(), scaleX: node.scaleX(), scaleY: node.scaleY(), rotation: node.rotation() });
                        }
                    }
                }}
            />
        </Layer>
        </Stage>
    </div>
  );
};
