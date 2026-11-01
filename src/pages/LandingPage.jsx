import { Link } from 'react-router-dom';
import { NotebookCover } from '../components/NotebookCover';
import { ArrowIcon } from '../components/Icons';
import { findByPath, formatMinutes, subjects, totals } from '../lib/notebook';
import { useProgress } from '../lib/progress';

function LandingPage() {
  const progress = useProgress();
  const lastRead = progress.last ? findByPath(progress.last) : null;
  const author = subjects.find((subject) => subject.author?.name)?.author;

  return (
    <div className="page landing">
      <section className="hero">
        <p className="hand hero-kicker">field notes{author?.name ? ` by ${author.name}` : ''}</p>
        <h1 className="hero-title">
          Engineering{' '}
          <span className="scribble">
            Notebook
            <svg viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true">
              <path d="M3 15 C 55 5, 105 21, 160 11 S 255 5, 297 14" />
            </svg>
          </span>
        </h1>
        <p className="hero-lede">
          Long-form notes on backend engineering, system design and building with AI, written while learning and kept
          for re-reading. Every page is plain Markdown, so if you spot a mistake or have a better explanation, open a pull request.
        </p>

        <dl className="stats">
          <div><dt>notebooks</dt><dd>{totals.subjects}</dd></div>
          <div><dt>chapters</dt><dd>{totals.chapters}</dd></div>
          <div><dt>of reading</dt><dd>{formatMinutes(totals.minutes)}</dd></div>
          <div><dt>diagrams</dt><dd>{totals.diagrams}</dd></div>
        </dl>
      </section>

      {lastRead && (
        <Link to={lastRead.chapter.path} className="sticky-note continue" style={{ '--c': lastRead.subject.color }}>
          <span className="hand continue-label">pick up where you left off</span>
          <span className="continue-title">{lastRead.chapter.title}</span>
          <span className="continue-meta">
            {lastRead.subject.title}
            {lastRead.subject.isSeries && ` · Chapter ${lastRead.chapter.number}`}
            <ArrowIcon size={16} />
          </span>
        </Link>
      )}

      <section className="shelf-section" aria-labelledby="shelf-title">
        <div className="section-head">
          <h2 id="shelf-title">The shelf</h2>
          <span className="hand annotation">pick a notebook ↓</span>
        </div>
        <div className="shelf">
          {subjects.map((subject) => (
            <NotebookCover
              key={subject.id}
              subject={subject}
              doneCount={subject.chapters.filter((chapter) => progress.done[chapter.path]).length}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export { LandingPage };
