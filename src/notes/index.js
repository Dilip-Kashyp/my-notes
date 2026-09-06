import { notes as pythonNotes, metadata as pythonMetadata } from './Python';
import { notes as aiNotes, metadata as aiMetadata } from './Chat Bot';
import { notes as systemDesignNotes, metadata as systemDesignMetadata } from './System Design'; 

export const allNotes = [
  { id: 'python', notes: pythonNotes, metadata: pythonMetadata },
  { id: 'ai-agent', notes: aiNotes, metadata: aiMetadata },
  { id: 'system-design', notes: systemDesignNotes, metadata: systemDesignMetadata },
];
