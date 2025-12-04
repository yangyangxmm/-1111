
export enum ShapeType {
  TREE = 'TREE',
  HEART = 'HEART',
  STAR = 'STAR',
  SPHERE = 'SPHERE',
  FIREWORK = 'FIREWORK'
}

export enum VisualMode {
  TREE = 'TREE',
  SATURN = 'SATURN',
  GALAXY = 'GALAXY',
  HEART = 'HEART'
}

export interface HandData {
  present: boolean;
  gesture: 'OPEN' | 'CLOSED' | 'PINCH' | 'OK' | 'NONE';
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  pinchDistance: number; // 0-1
  fingertips?: {x: number, y: number}[]; // Array of 5 tip positions
}

export interface AppState {
  shape: ShapeType;
  color: string;
  particleCount: number;
  visualMode: VisualMode;
}

export interface SceneProps {
  shape: ShapeType;
  color: string;
  handData: HandData;
  photos?: string[];
  visualMode: VisualMode;
}
