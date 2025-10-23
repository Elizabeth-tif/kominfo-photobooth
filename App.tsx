import React, { useState, useEffect, useRef } from 'react';
import CameraFeed, { CameraFeedHandle } from './components/CameraFeed';
import FrameSelector from './components/FrameSelector';
import FrameCreator from './components/FrameCreator';
import { FRAMES } from './constants';
import type { Frame } from './types';
import { CameraIcon, DownloadIcon, RetakeIcon, PlusIcon, MinusIcon } from './components/icons';

const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
    });
};

const App: React.FC = () => {
  const [allFrames, setAllFrames] = useState<Frame[]>(() => {
    try {
      const savedFrames = localStorage.getItem('customFrames');
      const customFrames: Frame[] = savedFrames ? JSON.parse(savedFrames) : [];
      return [...FRAMES, ...customFrames];
    } catch (error) {
      console.error("Failed to load custom frames:", error);
      return FRAMES;
    }
  });
  const [capturedImages, setCapturedImages] = useState<Record<number, string>>({});
  const [selectedFrameId, setSelectedFrameId] = useState<string>(allFrames[0].id);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showShutter, setShowShutter] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewScale, setPreviewScale] = useState(1); // 1 = 100%

  const cameraFeedRef = useRef<CameraFeedHandle>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  const selectedFrame = allFrames.find(f => f.id === selectedFrameId) || allFrames[0];
  const totalSlots = selectedFrame.slots.length;
  const isCaptureComplete = Object.keys(capturedImages).length >= totalSlots;

  const MIN_SCALE = 0.5;
  const MAX_SCALE = 1.5;
  const SCALE_STEP = 0.05;
  const BASE_PREVIEW_HEIGHT_PX = 480;

  const handleZoomIn = () => {
    setPreviewScale(prev => Math.min(MAX_SCALE, prev + SCALE_STEP));
  };

  const handleZoomOut = () => {
    setPreviewScale(prev => Math.max(MIN_SCALE, prev - SCALE_STEP));
  };

  const handleStartCapture = () => {
    if (isCaptureComplete) return;
    setCountdown(3);
    countdownIntervalRef.current = window.setInterval(() => {
        setCountdown(prev => (prev !== null && prev > 1) ? prev - 1 : 0);
    }, 1000);
  };
  
  useEffect(() => {
    if (countdown === 0) {
      window.clearInterval(countdownIntervalRef.current ?? undefined);
      setCountdown(null);
      
      const imageSrc = cameraFeedRef.current?.capture();
      if (imageSrc) {
        setCapturedImages(prev => ({...prev, [currentSlotIndex]: imageSrc}));
        setCurrentSlotIndex(prev => prev + 1);
      }
      setShowShutter(true);
      setTimeout(() => setShowShutter(false), 300);
    }
  }, [countdown, currentSlotIndex]);

  const handleRetake = () => {
    setCapturedImages({});
    setCurrentSlotIndex(0);
  };
  
  const handleRetakeSingle = (indexToRetake: number) => {
    setCurrentSlotIndex(indexToRetake);
    setCapturedImages(prev => {
        const newImages = { ...prev };
        delete newImages[indexToRetake];
        return newImages;
    });
  };

  const handleSelectFrame = (id: string) => {
    setSelectedFrameId(id);
    handleRetake();
  };

  const saveCustomFrames = (framesToSave: Frame[]) => {
    try {
      localStorage.setItem('customFrames', JSON.stringify(framesToSave));
    } catch (error) {
      console.error("Failed to save custom frames:", error);
    }
  };

  const handleSaveFrame = (newFrame: Frame) => {
    setAllFrames(prevFrames => {
      const updatedFrames = [...prevFrames, newFrame];
      saveCustomFrames(updatedFrames.filter(f => f.isCustom));
      return updatedFrames;
    });
    setSelectedFrameId(newFrame.id);
    setIsCreatorOpen(false);
    handleRetake();
  };

  const handleDeleteFrame = (idToDelete: string) => {
    if (selectedFrameId === idToDelete) {
        setSelectedFrameId(FRAMES[0].id);
        handleRetake();
    }
    setAllFrames(prevFrames => {
      const updatedFrames = prevFrames.filter(f => f.id !== idToDelete);
      saveCustomFrames(updatedFrames.filter(f => f.isCustom));
      return updatedFrames;
    });
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
        const canvas = document.createElement('canvas');
        let outputWidth: number, outputHeight: number;

        if (selectedFrame.backgroundImage) {
            const bgImg = await loadImage(selectedFrame.backgroundImage);
            outputHeight = 1080; // Standard height
            outputWidth = bgImg.width * (outputHeight / bgImg.height);
        } else {
            outputWidth = 1200;
            outputHeight = outputWidth / selectedFrame.aspectRatio;
        }

        canvas.width = outputWidth;
        canvas.height = outputHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        
        // Draw captured images first
        const loadedImagePromises: Promise<HTMLImageElement | null>[] = [];
        for (let i = 0; i < totalSlots; i++) {
          if (capturedImages[i]) {
            loadedImagePromises.push(loadImage(capturedImages[i]));
          } else {
            loadedImagePromises.push(Promise.resolve(null));
          }
        }
        const loadedImages = await Promise.all(loadedImagePromises);

        for (let i = 0; i < selectedFrame.slots.length; i++) {
            const slot = selectedFrame.slots[i];
            const img = loadedImages[i];
            if (!img) continue;

            const slotX = (slot.x / 100) * outputWidth;
            const slotY = (slot.y / 100) * outputHeight;
            const slotW = (slot.width / 100) * outputWidth;
            const slotH = (slot.height / 100) * outputHeight;

            const imgAspectRatio = img.width / img.height;
            const slotAspectRatio = slotW / slotH;
            let sx, sy, sWidth, sHeight;

            if (imgAspectRatio > slotAspectRatio) { // Image is wider
                sHeight = img.height;
                sWidth = sHeight * slotAspectRatio;
                sx = (img.width - sWidth) / 2;
                sy = 0;
            } else { // Image is taller or same aspect ratio
                sWidth = img.width;
                sHeight = sWidth / slotAspectRatio;
                sx = 0;
                sy = (img.height - sHeight) / 2;
            }
            ctx.drawImage(img, sx, sy, sWidth, sHeight, slotX, slotY, slotW, slotH);
        }

        // Draw background frame over the images
        if (selectedFrame.backgroundImage) {
            const bgImg = await loadImage(selectedFrame.backgroundImage);
            ctx.drawImage(bgImg, 0, 0, outputWidth, outputHeight);
        }

        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${selectedFrame.name.replace(/\s+/g, '-')}-photobooth.png`;
        a.click();
    } catch (error) {
        console.error("Failed to generate download image:", error);
        alert("Sorry, there was an error creating your download.");
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-200 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 space-y-6">
        <header className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 tracking-tight">
                Kominfo Photobooth ♡
            </h1>
        </header>
        
        <div className="w-full max-w-4xl flex flex-col items-center space-y-4">
            <div className="w-full flex justify-center items-center" style={{ height: `${BASE_PREVIEW_HEIGHT_PX * previewScale}px`}}>
              <div
                  className="relative shadow-xl border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ 
                    height: `${BASE_PREVIEW_HEIGHT_PX * previewScale}px`,
                    width: `${BASE_PREVIEW_HEIGHT_PX * previewScale * selectedFrame.aspectRatio}px`,
                  }}
              >
                  {/* Layer 1: Photos & Camera Feed */}
                  <div className={`absolute inset-0 ${selectedFrame.className || ''}`}>
                      {selectedFrame.slots.map((slot, index) => (
                          <div
                              key={index}
                              className="absolute overflow-hidden group"
                              style={{
                                  top: `${slot.y}%`,
                                  left: `${slot.x}%`,
                                  width: `${slot.width}%`,
                                  height: `${slot.height}%`
                              }}
                          >
                              {capturedImages[index] ? (
                                  <>
                                    <img src={capturedImages[index]} alt={`Capture ${index+1}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button 
                                          onClick={() => handleRetakeSingle(index)}
                                          className="flex items-center gap-2 px-3 py-1.5 bg-white/80 text-black font-semibold rounded-md shadow-md hover:bg-white text-sm"
                                        >
                                            <RetakeIcon className="w-4 h-4" />
                                            <span>Retake</span>
                                        </button>
                                    </div>
                                  </>
                              ) : (index === currentSlotIndex && !isCaptureComplete) ? (
                                  <CameraFeed ref={cameraFeedRef} countdown={countdown} showShutter={showShutter} />
                              ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-500 font-medium">Photo {index + 1}</span>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>

                  {/* Layer 2: Frame Image Overlay */}
                  {selectedFrame.backgroundImage && (
                      <img src={selectedFrame.backgroundImage} alt="Frame background" className="absolute inset-0 w-full h-full pointer-events-none" />
                  )}
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm p-1.5 rounded-full shadow">
              <button onClick={handleZoomOut} disabled={previewScale <= MIN_SCALE} className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Zoom Out">
                  <MinusIcon className="w-5 h-5 text-gray-700" />
              </button>
              <span className="text-sm font-semibold text-gray-700 w-12 text-center select-none">{Math.round(previewScale * 100)}%</span>
              <button onClick={handleZoomIn} disabled={previewScale >= MAX_SCALE} className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Zoom In">
                  <PlusIcon className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="flex items-center space-x-4 pt-2">
                {isCaptureComplete ? (
                    <>
                        <button onClick={handleRetake} className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 active:bg-gray-800 transform transition-transform hover:scale-105">
                            <RetakeIcon className="w-5 h-5" />
                            <span>Start Over</span>
                        </button>
                        <button onClick={handleDownload} disabled={isDownloading} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 active:bg-blue-800 transform transition-transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed">
                            <DownloadIcon className="w-5 h-5" />
                            <span>{isDownloading ? 'Generating...' : 'Download'}</span>
                        </button>
                    </>
                ) : (
                    <button onClick={handleStartCapture} disabled={countdown !== null} className="group flex items-center justify-center gap-3 px-8 py-4 bg-red-600 text-white font-bold rounded-full shadow-lg hover:bg-red-700 active:bg-red-800 transform transition-all duration-300 ease-in-out hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        <CameraIcon className="w-8 h-8 transition-transform duration-300 group-hover:rotate-12" />
                        <span className="text-xl">Capture Photo {currentSlotIndex + 1}/{totalSlots}</span>
                    </button>
                )}
            </div>

            <div className="pt-4 w-full">
              <FrameSelector 
                  frames={allFrames}
                  selectedFrameId={selectedFrameId}
                  onSelectFrame={handleSelectFrame}
                  onOpenCreator={() => setIsCreatorOpen(true)}
                  onDeleteFrame={handleDeleteFrame}
              />
            </div>
        </div>

        {isCreatorOpen && (
            <FrameCreator 
                onSave={handleSaveFrame}
                onClose={() => setIsCreatorOpen(false)}
            />
        )}
    </div>
  );
};

export default App;