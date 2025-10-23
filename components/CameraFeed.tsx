import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';

interface CameraFeedProps {
  countdown: number | null;
  showShutter: boolean;
}

export interface CameraFeedHandle {
  capture: () => string | null;
}

const CameraFeed = forwardRef<CameraFeedHandle, CameraFeedProps>(({ countdown, showShutter }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const setupCamera = useCallback(async () => {
    // Stop any existing stream before starting a new one
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setError(null);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access the camera. Please check permissions and try again.');
    }
  }, []);

  useEffect(() => {
    setupCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [setupCamera]);
  
  useImperativeHandle(ref, () => ({
    capture: () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (context && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          // Flip the image horizontally
          context.translate(video.videoWidth, 0);
          context.scale(-1, 1);
          context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          // Reset transformation
          context.setTransform(1, 0, 0, 1, 0, 0);
          return canvas.toDataURL('image/png');
        }
      }
      return null;
    }
  }));

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
        />
        {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white p-4">
                <p className="text-center">{error}</p>
            </div>
        )}
        {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-9xl font-bold" style={{ textShadow: '0 0 15px rgba(0,0,0,0.7)' }}>{countdown}</span>
            </div>
        )}
        {showShutter && <div className="absolute inset-0 bg-white shutter-flash" />}
        <canvas ref={canvasRef} className="hidden" />
    </div>
  );
});

export default CameraFeed;