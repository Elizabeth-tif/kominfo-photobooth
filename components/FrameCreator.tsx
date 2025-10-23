import React, { useState, useRef, MouseEvent } from 'react';
import type { Frame, FrameSlot } from '../types';
import { PlusIcon, TrashIcon, MoveIcon, DuplicateIcon, MinusIcon } from './icons';

interface FrameCreatorProps {
  onSave: (newFrame: Frame) => void;
  onClose: () => void;
}

type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br';

const FrameCreator: React.FC<FrameCreatorProps> = ({ onSave, onClose }) => {
  const [frameName, setFrameName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState(16 / 9);
  const [slots, setSlots] = useState<FrameSlot[]>([]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef<{
    type: 'move' | 'resize';
    handle?: ResizeHandle;
    slotIndex: number;
    startX: number;
    startY: number;
    originalSlot: FrameSlot;
  } | null>(null);

  const MIN_SCALE = 0.1;
  const MAX_SCALE = 4.0;
  const SCALE_STEP = 0.1;
  const BASE_EDITOR_WIDTH_PX = 500;

  const handleZoomIn = () => setPreviewScale(prev => Math.min(MAX_SCALE, prev + SCALE_STEP));
  const handleZoomOut = () => setPreviewScale(prev => Math.max(MIN_SCALE, prev - SCALE_STEP));

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setAspectRatio(img.width / img.height);
          setBackgroundImage(e.target?.result as string);
          if (!frameName) {
            setFrameName(file.name.replace(/\.[^/.]+$/, ""));
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };
  
  const addSlot = () => {
    const newSlot: FrameSlot = { x: 25, y: 25, width: 50, height: 50 };
    setSlots([...slots, newSlot]);
    setSelectedSlotIndex(slots.length);
  };

  const deleteSelectedSlot = () => {
    if (selectedSlotIndex === null) return;
    setSlots(slots.filter((_, index) => index !== selectedSlotIndex));
    setSelectedSlotIndex(null);
  };
  
  const duplicateSelectedSlot = () => {
    if (selectedSlotIndex === null) return;
    const slotToDuplicate = slots[selectedSlotIndex];
    const newSlot: FrameSlot = { 
      ...slotToDuplicate, 
      x: Math.min(slotToDuplicate.x + 5, 100 - slotToDuplicate.width), 
      y: Math.min(slotToDuplicate.y + 5, 100 - slotToDuplicate.height)
    };
    setSlots([...slots, newSlot]);
    setSelectedSlotIndex(slots.length);
  };

  const handleInteractionStart = (e: MouseEvent, type: 'move' | 'resize', slotIndex: number, handle?: ResizeHandle) => {
    e.stopPropagation();
    setSelectedSlotIndex(slotIndex);
    if (!previewRef.current) return;
    
    const scaledX = e.clientX / previewScale;
    const scaledY = e.clientY / previewScale;

    interactionRef.current = {
      type,
      handle,
      slotIndex,
      startX: scaledX,
      startY: scaledY,
      originalSlot: { ...slots[slotIndex] },
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleMouseMove = (e: globalThis.MouseEvent) => {
    if (!interactionRef.current || !previewRef.current) return;
    
    const { type, handle, startX, startY, originalSlot } = interactionRef.current;

    const scaledX = e.clientX / previewScale;
    const scaledY = e.clientY / previewScale;

    const dx = scaledX - startX;
    const dy = scaledY - startY;

    const { width: previewW, height: previewH } = previewRef.current.getBoundingClientRect();
    const previewWidthNoScale = previewW / previewScale;
    const previewHeightNoScale = previewH / previewScale;

    const dxPercent = (dx / previewWidthNoScale) * 100;
    const dyPercent = (dy / previewHeightNoScale) * 100;
    
    let newSlot = { ...originalSlot };

    if (type === 'move') {
      newSlot.x = originalSlot.x + dxPercent;
      newSlot.y = originalSlot.y + dyPercent;
    } else if (type === 'resize' && handle) {
        if(handle.includes('l')) {
            newSlot.x = originalSlot.x + dxPercent;
            newSlot.width = originalSlot.width - dxPercent;
        }
        if(handle.includes('r')) {
            newSlot.width = originalSlot.width + dxPercent;
        }
        if(handle.includes('t')) {
            newSlot.y = originalSlot.y + dyPercent;
            newSlot.height = originalSlot.height - dyPercent;
        }
        if(handle.includes('b')) {
            newSlot.height = originalSlot.height + dyPercent;
        }
    }
    
    // Clamp values to be within bounds
    newSlot.x = Math.max(0, Math.min(100 - newSlot.width, newSlot.x));
    newSlot.y = Math.max(0, Math.min(100 - newSlot.height, newSlot.y));
    newSlot.width = Math.max(5, Math.min(100 - newSlot.x, newSlot.width));
    newSlot.height = Math.max(5, Math.min(100 - newSlot.y, newSlot.height));

    setSlots(prev => prev.map((s, i) => i === interactionRef.current?.slotIndex ? newSlot : s));
  };

  const handleMouseUp = () => {
    interactionRef.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  const handleSave = () => {
    if (!frameName || !backgroundImage) {
      alert('Please provide a frame name and a background image.');
      return;
    }
    const newFrame: Frame = {
      id: `custom-${Date.now()}`,
      name: frameName,
      aspectRatio,
      slots,
      backgroundImage,
      isCustom: true,
    };
    onSave(newFrame);
  };

  const isSaveDisabled = !frameName || !backgroundImage || slots.length === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden">
        {/* Left Side - Editor */}
        <div className="w-full md:w-2/3 p-6 flex flex-col items-center justify-center bg-gray-100 space-y-4">
          <h3 className="text-xl font-bold text-gray-800">Interactive Editor</h3>
          <div className="relative w-full flex-grow flex items-center justify-center overflow-auto">
            <div
              ref={previewRef}
              className="relative bg-gray-300 border-2 border-dashed border-gray-400 rounded-md select-none transition-all duration-200"
              style={{ 
                  width: `${BASE_EDITOR_WIDTH_PX * previewScale}px`,
                  height: `${(BASE_EDITOR_WIDTH_PX / aspectRatio) * previewScale}px`,
                  flexShrink: 0,
              }}
              onMouseDown={() => setSelectedSlotIndex(null)}
            >
              {/* Layer 0: Background Image */}
              {backgroundImage && (
                <img src={backgroundImage} alt="Frame background" className="absolute inset-0 w-full h-full" />
              )}

              {/* Layer 1: Slots */}
              {slots.map((slot, index) => (
                  <div
                      key={index}
                      className="absolute box-border z-10"
                      style={{
                        top: `${slot.y}%`, left: `${slot.x}%`,
                        width: `${slot.width}%`, height: `${slot.height}%`,
                        backgroundColor: 'rgba(59, 130, 246, 0.4)',
                        border: `2px dashed ${selectedSlotIndex === index ? '#0000FF' : 'rgba(255,255,255,0.7)'}`,
                        cursor: 'move',
                      }}
                      onMouseDown={(e) => handleInteractionStart(e, 'move', index)}
                  >
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl pointer-events-none">
                          {index + 1}
                      </div>
                      {selectedSlotIndex === index && (
                          <>
                            {(['tl', 'tr', 'bl', 'br'] as ResizeHandle[]).map(handle => (
                              <div 
                                key={handle}
                                className="absolute bg-white border-2 border-blue-600 w-3 h-3 -m-1.5 z-20"
                                style={{
                                  top: handle.includes('t') ? 0 : '100%',
                                  left: handle.includes('l') ? 0 : '100%',
                                  cursor: `${handle.includes('t') ? 'n' : 's'}${handle.includes('l') ? 'w' : 'e'}-resize`
                                }}
                                onMouseDown={(e) => handleInteractionStart(e, 'resize', index, handle)}
                              />
                            ))}
                          </>
                      )}
                  </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Controls */}
        <div className="w-full md:w-1/3 p-6 flex flex-col space-y-4 overflow-y-auto">
          <h2 className="text-2xl font-bold text-gray-800">Custom Frame Details</h2>
          <div>
            <label htmlFor="frameName" className="block text-sm font-medium text-gray-700 mb-1">Frame Name</label>
            <input type="text" id="frameName" value={frameName} onChange={(e) => setFrameName(e.target.value)} placeholder="e.g., Vacation Memories" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Background Image</label>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                {backgroundImage ? 'Change Image' : 'Upload Image'}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </div>

          <div className="border-t pt-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">Editor Controls</label>
            <button onClick={addSlot} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 shadow-sm">
              <PlusIcon className="w-4 h-4" /> Add Slot
            </button>
            <div className="flex items-center justify-center space-x-2 bg-gray-100 p-1.5 rounded-full">
              <button onClick={handleZoomOut} disabled={previewScale <= MIN_SCALE} className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Zoom Out">
                <MinusIcon className="w-5 h-5 text-gray-700" />
              </button>
              <span className="text-sm font-semibold text-gray-700 w-12 text-center select-none">{Math.round(previewScale * 100)}%</span>
              <button onClick={handleZoomIn} disabled={previewScale >= MAX_SCALE} className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Zoom In">
                <PlusIcon className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Selected Slot Actions</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={duplicateSelectedSlot} disabled={selectedSlotIndex === null} className="flex items-center justify-center gap-2 px-2 py-2 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                <DuplicateIcon className="w-4 h-4" /> Duplicate
              </button>
              <button onClick={deleteSelectedSlot} disabled={selectedSlotIndex === null} className="flex items-center justify-center gap-2 px-2 py-2 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400">
                <TrashIcon className="w-4 h-4" /> Delete
              </button>
            </div>
            {selectedSlotIndex !== null && (
              <p className="text-xs text-center text-gray-500 mt-2">
                <MoveIcon className="w-3 h-3 inline-block mr-1" />
                Drag a slot to move it or use the corner handles to resize.
              </p>
            )}
          </div>
          <div className="flex-grow"></div>
          <div className="flex justify-end items-center space-x-4 pt-4 border-t">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
            <button onClick={handleSave} disabled={isSaveDisabled} className="px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">Save Frame</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrameCreator;