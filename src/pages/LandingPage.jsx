import { Link } from 'react-router-dom';
import { NotebookCover } from '../components/NotebookCover';
import { ArrowIcon } from '../components/Icons';
import { findByPath, subjects } from '../lib/notebook';
import { useProgress } from '../lib/progress';

function LandingPage() {
  const progress = useProgress();
  const lastRead = progress.last ? findByPath(progress.last) : null;
  const author = subjects.find((subject) => subject.author?.name)?.author;

  return (
    <div className="page landing">
      <section className="hero">
        <p className="hand hero-kicker">field notes for product engineers{author?.name ? ` · ${author.name}` : ''}</p>
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
          Long-form notes on backend systems, product thinking, and building with AI. The goal is simple: keep the useful patterns close at hand and easy to revisit.
        </p>

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
