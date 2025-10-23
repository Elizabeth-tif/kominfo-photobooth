import type { Frame } from './types';

export const FRAMES: Frame[] = [
  {
    id: 'classic-single',
    name: 'Single Photo',
    className: 'bg-yellow-900 border-4 border-yellow-900/80 shadow-lg p-4',
    aspectRatio: 4 / 3,
    slots: [
      { x: 0, y: 0, width: 100, height: 100 },
    ],
  },
  {
    id: 'film-strip-vertical',
    name: 'Film Strip',
    className: 'bg-black p-2',
    aspectRatio: 9 / 16,
    slots: [
      { x: 5, y: 2, width: 90, height: 30 },
      { x: 5, y: 35, width: 90, height: 30 },
      { x: 5, y: 68, width: 90, height: 30 },
    ],
  },
  {
    id: 'duo-horizontal',
    name: 'Side by Side',
    className: 'bg-slate-300 border-4 border-slate-400 shadow-inner bg-gradient-to-br from-slate-200 to-slate-400 p-2',
    aspectRatio: 16 / 9,
    slots: [
        { x: 0, y: 0, width: 50, height: 100 },
        { x: 50, y: 0, width: 50, height: 100 },
    ],
  },
  {
    id: 'quad-collage',
    name: 'Quad Collage',
    className: 'bg-white shadow-md border border-gray-200 p-2',
    aspectRatio: 1,
    slots: [
        { x: 0, y: 0, width: 50, height: 50 },
        { x: 50, y: 0, width: 50, height: 50 },
        { x: 0, y: 50, width: 50, height: 50 },
        { x: 50, y: 50, width: 50, height: 50 },
    ]
  },
];