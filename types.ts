export interface FrameSlot {
  x: number;      // percentage (0-100)
  y: number;      // percentage (0-100)
  width: number;  // percentage (0-100)
  height: number; // percentage (0-100)
}

export interface Frame {
  id: string;
  name: string;
  // className is now optional, used for non-image frames
  className?: string;
  // aspectRatio is now a number for easier calculations
  aspectRatio: number; // width / height
  slots: FrameSlot[];
  backgroundImage?: string; // dataURL of the background image
  isCustom?: boolean;
}