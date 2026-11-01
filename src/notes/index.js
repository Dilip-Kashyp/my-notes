import { notes as pythonNotes, metadata as pythonMetadata } from './Python';
import { notes as aiNotes, metadata as aiMetadata } from './Chat Bot';
import { notes as systemDesignNotes, metadata as systemDesignMetadata } from './System Design';
import { chapters as backendChapters, metadata as backendMetadata } from './Backend Engineering';

export const allNotes = [
  { id: 'python', notes: pythonNotes, metadata: pythonMetadata },
  { id: 'ai-agent', notes: aiNotes, metadata: aiMetadata },
  { id: 'system-design', notes: systemDesignNotes, metadata: systemDesignMetadata },
  { id: 'backend-engineering', chapters: backendChapters, metadata: backendMetadata },
];
