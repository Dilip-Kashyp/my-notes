import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthorPopover } from '../components/AuthorPopover';
import { ArrowIcon, CheckIcon, ListIcon } from '../components/Icons';
import { NoteContent } from '../components/NoteContent';
import { pad } from '../lib/notebook';
import { markVisited, toggleDone, useProgress } from '../lib/progress';

// Headings within this distance of the top bar count as "being read"
const ACTIVE_OFFSET = 140;

function useReadingPosition(articleRef, headings) {
  const [position, setPosition] = useState({ progress: 0, activeId: null });

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const article = articleRef.current;
      if (!article) {
        return;
      }
      const rect = article.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 1;
      let activeId = null;
      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (!element || element.getBoundingClientRect().top > ACTIVE_OFFSET) {
          break;
        }
        activeId = heading.id;
      }
      setPosition((previous) =>
        previous.activeId === activeId && Math.abs(previous.progress - progress) < 0.002 ? previous : { progress, activeId },
      );
    };
    const schedule = () => {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    };

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [articleRef, headings]);

  return position;
}

function DoneButton({ done, path, large }) {
  return (
    <button
      type="button"
      className={`done-button${done ? ' is-done' : ''}${large ? ' done-button-large' : ''}`}
      onClick={() => toggleDone(path)}
      aria-pressed={done}
    >
      <CheckIcon size={large ? 18 : 15} />
      {done ? 'Done, nice work' : large ? 'Mark this chapter as done' : 'Mark as done'}
    </button>
  );
}

export function NotePage({ subject, chapter }) {
  const progressState = useProgress();
  const articleRef = useRef(null);
  const tocRef = useRef(null);
  const [tocOpen, setTocOpen] = useState(false);
  const { progress, activeId } = useReadingPosition(articleRef, chapter.headings);
  const done = Boolean(progressState.done[chapter.path]);
  const index = chapter.number - 1;
  const prev = subject.chapters[index - 1];
  const next = subject.chapters[index + 1];

  useEffect(() => {
    markVisited(chapter.path);
  }, [chapter.path]);

  // Keep the highlighted contents entry visible inside the sidebar
  useEffect(() => {
    const toc = tocRef.current;
    const link = activeId ? toc?.querySelector(`[data-id="${activeId}"]`) : null;
    if (link && (link.offsetTop < toc.scrollTop || link.offsetTop > toc.scrollTop + toc.clientHeight - 40)) {
      toc.scrollTo({ top: link.offsetTop - toc.clientHeight / 3 });
    }
  }, [activeId]);

  return (
    <div className="reader" style={{ '--c': subject.color }}>
      <div className="reading-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>

      <aside className={`reader-aside${tocOpen ? ' is-open' : ''}`} aria-label="Chapter contents">
        <div className="aside-head">
          <Link to={subject.path} className="aside-subject">{subject.title}</Link>
          {subject.isSeries && (
            <span className="aside-chapter">Chapter {chapter.number} of {subject.chapters.length}</span>
          )}
        </div>
        {chapter.headings.length > 0 && (
          <>
            <p className="aside-label">On this page</p>
            <nav className="toc" ref={tocRef}>
              <ol>
                {chapter.headings.map((heading) => (
                  <li key={heading.id} className={`toc-l${heading.level}${heading.id === activeId ? ' is-active' : ''}`}>
                    <a href={`#${heading.id}`} data-id={heading.id} onClick={() => setTocOpen(false)}>
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </>
        )}
      </aside>

      <article className={`sheet${done ? ' is-done' : ''}`} ref={articleRef}>
        {done && <span className="done-stamp" aria-hidden="true">done</span>}
        <header className="sheet-head">
          <p className="kicker">
            <Link to={subject.path}>{subject.title}</Link>
            {subject.isSeries && <span> · Chapter {pad(chapter.number)}</span>}
          </p>
          <h1>{chapter.title}</h1>
          {chapter.subtitle && <p className="sheet-subtitle">{chapter.subtitle}</p>}
          <div className="sheet-meta">
            <span>{chapter.minutes} min read</span>
            {chapter.sections > 0 && <span>{chapter.sections} sections</span>}
            {chapter.diagrams > 0 && <span>{chapter.diagrams} diagrams</span>}
            {chapter.author && (
              <span className="sheet-author">by <AuthorPopover author={chapter.author} /></span>
            )}
          </div>
          <DoneButton done={done} path={chapter.path} />
        </header>

        <NoteContent markdown={chapter.body} />

        <footer className="sheet-foot">
          <div className="sheet-end">
            <span className="hand">— end of {subject.isSeries ? 'chapter' : 'notes'} —</span>
            <DoneButton done={done} path={chapter.path} large />
          </div>
          {(prev || next) && (
            <nav className="chapter-nav" aria-label="Chapters">
              {prev ? (
                <Link to={prev.path} className="chapter-nav-card">
                  <span className="chapter-nav-dir"><ArrowIcon direction="left" size={15} /> Previous</span>
                  <span className="chapter-nav-title">{prev.title}</span>
                </Link>
              ) : <span />}
              {next && (
                <Link to={next.path} className="chapter-nav-card is-next">
                  <span className="chapter-nav-dir">Next <ArrowIcon size={15} /></span>
                  <span className="chapter-nav-title">{next.title}</span>
                </Link>
              )}
            </nav>
          )}
        </footer>
      </article>

      {chapter.headings.length > 0 && (
        <button type="button" className="toc-fab" onClick={() => setTocOpen((open) => !open)} aria-expanded={tocOpen}>
          <ListIcon size={16} /> {tocOpen ? 'Close' : 'Contents'} · {Math.round(progress * 100)}%
        </button>
      )}
    </div>
  );
}
