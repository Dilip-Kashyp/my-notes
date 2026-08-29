import { notes as pythonNotes, metadata as pythonMetadata } from './Python';
import { notes as aiNotes, metadata as aiMetadata } from './AI Agent';

export const allNotes = [
  { id: 'python', notes: pythonNotes, metadata: pythonMetadata },
  { id: 'ai-agent', notes: aiNotes, metadata: aiMetadata },
];
