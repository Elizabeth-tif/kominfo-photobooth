import React from 'react';
import type { Frame } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface FrameSelectorProps {
  frames: Frame[];
  selectedFrameId: string;
  onSelectFrame: (id: string) => void;
  onOpenCreator: () => void;
  onDeleteFrame: (id: string) => void;
}

const FrameSelector: React.FC<FrameSelectorProps> = ({ frames, selectedFrameId, onSelectFrame, onOpenCreator, onDeleteFrame }) => {
  
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent frame selection when deleting
    if (window.confirm('Are you sure you want to delete this custom frame?')) {
      onDeleteFrame(id);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-white/50 backdrop-blur-sm rounded-xl shadow-md">
      <h3 className="text-center text-lg font-semibold text-gray-700 mb-4">Choose Your Frame</h3>
      <div className="flex justify-center items-start gap-4 flex-wrap">
        {frames.map((frame) => (
          <div key={frame.id} className="flex flex-col items-center gap-2 group">
            <div
              onClick={() => onSelectFrame(frame.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectFrame(frame.id); }}
              role="button"
              tabIndex={0}
              className={`relative w-24 h-24 rounded-md transition-all duration-200 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-400 cursor-pointer ${
                !frame.backgroundImage ? frame.className?.split(' ').filter(c => !c.startsWith('p-') && !c.startsWith('aspect-')).join(' ') : ''
              } ${
                selectedFrameId === frame.id ? 'ring-4 ring-offset-2 ring-blue-500' : 'ring-2 ring-transparent'
              }`}
              style={frame.backgroundImage ? { backgroundImage: `url(${frame.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center'} : {}}
              aria-label={`Select ${frame.name} frame`}
            >
              <div className="relative w-full h-full overflow-hidden rounded-md">
                {frame.slots.map((slot, index) => (
                    <div
                        key={index}
                        className="absolute bg-gray-300/50 border border-dashed border-gray-400/80"
                        style={{
                          top: `${slot.y}%`,
                          left: `${slot.x}%`,
                          width: `${slot.width}%`,
                          height: `${slot.height}%`
                        }}
                    />
                ))}
              </div>
              {frame.isCustom && (
                <button 
                  onClick={(e) => handleDelete(e, frame.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Delete ${frame.name} frame`}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
             <p className="text-sm font-medium text-gray-600 text-center w-24 truncate">{frame.name}</p>
          </div>
        ))}

        <div className="flex flex-col items-center gap-2">
            <button
                onClick={onOpenCreator}
                className="relative w-24 h-24 rounded-md transition-all duration-200 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-400 bg-gray-200 hover:bg-gray-300 flex items-center justify-center border-2 border-dashed border-gray-400"
                aria-label="Create new custom frame"
            >
                <PlusIcon className="w-10 h-10 text-gray-500"/>
            </button>
            <p className="text-sm font-medium text-gray-600">Create New</p>
        </div>
      </div>
    </div>
  );
};

export default FrameSelector;