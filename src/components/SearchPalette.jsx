import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchIndex } from '../lib/notebook';
import { SearchIcon } from './Icons';

const MAX_RESULTS = 40;

function search(query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return searchIndex.filter((item) => item.kind === 'chapter').slice(0, MAX_RESULTS);
  }
  const scored = [];
  for (const item of searchIndex) {
    const title = item.title.toLowerCase();
    const haystack = `${title} ${item.context.toLowerCase()}`;
    if (words.every((word) => haystack.includes(word))) {
      const score = (title.startsWith(words[0]) ? 0 : 2) + (words.every((word) => title.includes(word)) ? 0 : 1) + (item.kind === 'chapter' ? 0 : 0.5);
      scored.push({ item, score });
    }
  }
  return scored.sort((a, b) => a.score - b.score).slice(0, MAX_RESULTS).map(({ item }) => item);
}

export function SearchPalette({ initialQuery = '', onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);
  const results = search(query);
  const active = Math.min(activeIndex, Math.max(results.length - 1, 0));

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function open(item) {
    onClose();
    navigate(item.path);
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((active + 1) % Math.max(results.length, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((active - 1 + results.length) % Math.max(results.length, 1));
    } else if (event.key === 'Enter' && results[active]) {
      event.preventDefault();
      open(results[active]);
    } else if (event.key === 'Escape') {
      onClose();
    }
  }

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Search notes" onMouseDown={(event) => event.stopPropagation()}>
        <div className="palette-input">
          <SearchIcon />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search chapters and sections…"
            aria-label="Search chapters and sections"
            aria-controls="palette-results"
          />
          <kbd>Esc</kbd>
        </div>
        <ul className="palette-results" id="palette-results" role="listbox" ref={listRef}>
          {results.length === 0 && <li className="palette-empty">Nothing in the notebook matches “{query}”.</li>}
          {results.map((item, index) => (
            <li
              key={item.path}
              role="option"
              aria-selected={index === active}
              className={`palette-item${index === active ? ' is-active' : ''}`}
              style={{ '--c': item.color }}
              onMouseMove={() => setActiveIndex(index)}
              onClick={() => open(item)}
            >
              <span className={`palette-kind palette-kind-${item.kind}`}>{item.kind === 'chapter' ? 'Ch' : '§'}</span>
              <span className="palette-text">
                <span className="palette-title">{item.title}</span>
                <span className="palette-context">{item.context}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="palette-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
          <span><kbd>↵</kbd> open</span>
        </div>
      </div>
    </div>
  );
}
