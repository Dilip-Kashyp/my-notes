import { Link } from 'react-router-dom';
import { ArrowIcon, CheckIcon } from '../components/Icons';
import { formatMinutes, pad } from '../lib/notebook';
import { useProgress } from '../lib/progress';

// Contents page of a multi-chapter notebook, laid out like the index at the front of a book
export function SubjectPage({ subject }) {
  const progress = useProgress();
  const { chapters } = subject;
  const doneCount = chapters.filter((chapter) => progress.done[chapter.path]).length;
  const lastHere = chapters.find((chapter) => chapter.path === progress.last);
  const next = (lastHere && !progress.done[lastHere.path] ? lastHere : null)
    ?? chapters.find((chapter) => !progress.done[chapter.path])
    ?? chapters[0];
  const started = doneCount > 0 || Boolean(lastHere);

  return (
    <div className="page subject-page" style={{ '--c': subject.color }}>
      <header className="subject-hero">
        <div className="mini-cover" aria-hidden="true">
          <span className="cover-band" />
          <span className="mini-cover-label">{subject.title}</span>
        </div>
        <div className="subject-hero-text">
          <p className="kicker">Notebook No. {pad(subject.number)}</p>
          <h1>{subject.title}</h1>
          {subject.tagline && <p className="lede">{subject.tagline}</p>}
          <ul className="meta-row">
            <li>{chapters.length} chapters</li>
            <li>{formatMinutes(subject.minutes)} of reading</li>
            {subject.diagrams > 0 && <li>{subject.diagrams} diagrams</li>}
          </ul>
          <div className="subject-actions">
            <Link to={next.path} className="btn btn-primary">
              {started ? 'Continue' : 'Start reading'}: {next.title} <ArrowIcon size={16} />
            </Link>
            <div className="progress-meter">
              <span className="progress-track"><span style={{ width: `${(doneCount / chapters.length) * 100}%` }} /></span>
              <span className="progress-text">{doneCount} of {chapters.length} done</span>
            </div>
          </div>
        </div>
      </header>

      <section className="index-sheet" aria-labelledby="contents-title">
        <h2 id="contents-title" className="index-title">Contents</h2>
        <ol className="chapter-index">
          {chapters.map((chapter) => {
            const done = Boolean(progress.done[chapter.path]);
            const current = chapter.path === progress.last;
            return (
              <li key={chapter.path} className={`${done ? 'is-done' : ''} ${current ? 'is-current' : ''}`}>
                <Link to={chapter.path}>
                  <span className="ci-num">{pad(chapter.number)}</span>
                  <span className="ci-text">
                    <span className="ci-title">{chapter.title}</span>
                    <span className="ci-sub">
                      {chapter.sections} sections{chapter.diagrams > 0 && ` · ${chapter.diagrams} diagrams`}
                      {current && !done && <span className="hand ci-here">← you were here</span>}
                    </span>
                  </span>
                  <span className="ci-leader" aria-hidden="true" />
                  <span className="ci-time">{chapter.minutes} min</span>
                  <span className="ci-status" aria-label={done ? 'done' : 'not read yet'}>{done && <CheckIcon size={16} />}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
