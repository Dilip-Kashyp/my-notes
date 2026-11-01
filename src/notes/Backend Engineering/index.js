import metadata from './metadata.js';

// Every sub-folder with a notes.md + metadata.js is a chapter, ordered by folder name ("01 HTTP", "02 Routing", ...).
const chapterNotes = import.meta.glob('./*/notes.md', { query: '?raw', import: 'default', eager: true });
const chapterMetadata = import.meta.glob('./*/metadata.js', { import: 'default', eager: true });

const chapters = Object.keys(chapterNotes)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((path) => {
    const folder = path.slice(0, path.lastIndexOf('/'));
    const chapterMeta = chapterMetadata[`${folder}/metadata.js`];
    return { id: chapterMeta.id, notes: chapterNotes[path], metadata: chapterMeta };
  });

export { chapters, metadata };
