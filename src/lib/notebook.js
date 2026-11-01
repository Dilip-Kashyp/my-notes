import { allNotes } from '../notes';

// Cover colours for subjects that don't set `color` in their metadata.js
const COVER_COLORS = ['#2f6f5e', '#6b4f9e', '#2f5d8a', '#b5452f', '#a0702a', '#3d6b8c'];
const WORDS_PER_MINUTE = 220;

export function generateId(text) {
  return text.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Gives repeated headings ("Demo", "Demo") distinct ids ("demo", "demo-2")
export function createIdGenerator() {
  const seen = new Map();
  return (text) => {
    const base = generateId(text) || 'section';
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  };
}

// h2/h3 headings of a markdown body, skipping fenced code. Ids match rehypeHeadingIds below.
export function extractHeadings(markdown) {
  const nextId = createIdGenerator();
  const headings = [];
  let inCodeBlock = false;
  for (const line of markdown.split('\n')) {
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) {
      continue;
    }
    const match = line.match(/^(#{2,3})\s+(.*)/);
    if (match) {
      const text = match[2].replace(/\*\*|`|\\/g, '').trim();
      headings.push({ level: match[1].length, text, id: nextId(text) });
    }
  }
  return headings;
}

function hastText(node) {
  if (node.type === 'text') {
    return node.value;
  }
  return (node.children ?? []).map(hastText).join('');
}

// rehype plugin: puts the same ids extractHeadings() computes onto the rendered h2/h3s
export function rehypeHeadingIds() {
  return (tree) => {
    const nextId = createIdGenerator();
    const visit = (node) => {
      if (node.type === 'element' && (node.tagName === 'h2' || node.tagName === 'h3')) {
        node.properties = { ...node.properties, id: nextId(hastText(node)) };
        return;
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

export function formatMinutes(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = minutes / 60;
  return `${hours < 10 ? hours.toFixed(1).replace(/\.0$/, '') : Math.round(hours)} h`;
}

export function pad(number) {
  return String(number).padStart(2, '0');
}

function tagline(metadata) {
  return metadata.description && !/min read/i.test(metadata.description) ? metadata.description : null;
}

function buildChapter(subject, entry, index) {
  const path = subject.isSeries ? `${subject.path}/${entry.metadata.id}` : subject.path;
  const lines = entry.notes.split('\n');
  const firstLine = lines.findIndex((line) => line.trim());
  let body = entry.notes;
  let subtitle = null;

  // The note's own "# Title" becomes the page subtitle instead of a second h1
  if (firstLine >= 0 && /^#\s+/.test(lines[firstLine])) {
    subtitle = lines[firstLine].replace(/^#\s+/, '').replace(/^My Notes:\s*/i, '').trim();
    body = lines.slice(firstLine + 1).join('\n');
  }

  const words = body.split(/\s+/).filter(Boolean).length;
  const headings = extractHeadings(body);

  return {
    id: entry.metadata.id,
    number: index + 1,
    path,
    title: entry.metadata.title,
    subtitle: subtitle && subtitle !== entry.metadata.title ? subtitle : null,
    author: entry.metadata.author ?? subject.author,
    body,
    headings,
    sections: headings.filter((heading) => heading.level === 2).length,
    diagrams: (body.match(/^```mermaid/gm) ?? []).length,
    minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
  };
}

export const subjects = allNotes.map((note, index) => {
  const subject = {
    id: note.id,
    number: index + 1,
    path: `/notes/${note.id}`,
    title: note.metadata.title,
    tagline: tagline(note.metadata),
    topics: (note.metadata.topic ?? '').split(',').map((topic) => topic.trim()).filter(Boolean),
    author: note.metadata.author,
    color: note.metadata.color ?? COVER_COLORS[index % COVER_COLORS.length],
    isSeries: Boolean(note.chapters),
  };
  const entries = note.chapters ?? [{ notes: note.notes, metadata: note.metadata }];
  subject.chapters = entries.map((entry, chapterIndex) => buildChapter(subject, entry, chapterIndex));
  subject.minutes = subject.chapters.reduce((sum, chapter) => sum + chapter.minutes, 0);
  subject.diagrams = subject.chapters.reduce((sum, chapter) => sum + chapter.diagrams, 0);
  return subject;
});

export const totals = {
  subjects: subjects.length,
  chapters: subjects.reduce((sum, subject) => sum + subject.chapters.length, 0),
  minutes: subjects.reduce((sum, subject) => sum + subject.minutes, 0),
  diagrams: subjects.reduce((sum, subject) => sum + subject.diagrams, 0),
};

// { subject, chapter } for a route; chapter is null on a series' contents page. Returns null when nothing matches.
export function resolveRoute(topic, chapterId) {
  const subject = subjects.find((item) => item.id === topic);
  if (!subject) {
    return null;
  }
  if (!subject.isSeries) {
    return chapterId ? null : { subject, chapter: subject.chapters[0] };
  }
  if (!chapterId) {
    return { subject, chapter: null };
  }
  const chapter = subject.chapters.find((item) => item.id === chapterId);
  return chapter ? { subject, chapter } : null;
}

export function findByPath(path) {
  for (const subject of subjects) {
    const chapter = subject.chapters.find((item) => item.path === path);
    if (chapter) {
      return { subject, chapter };
    }
  }
  return null;
}

export const searchIndex = subjects.flatMap((subject) =>
  subject.chapters.flatMap((chapter) => {
    const where = subject.isSeries ? `${subject.title} · Chapter ${pad(chapter.number)}` : subject.title;
    return [
      { kind: 'chapter', title: chapter.title, context: where, path: chapter.path, color: subject.color },
      ...chapter.headings.map((heading) => ({
        kind: 'section',
        title: heading.text,
        context: `${where} › ${chapter.title}`,
        path: `${chapter.path}#${heading.id}`,
        color: subject.color,
      })),
    ];
  }),
);
