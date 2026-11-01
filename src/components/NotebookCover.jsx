import { Link } from 'react-router-dom';
import { formatMinutes, pad } from '../lib/notebook';

export function NotebookCover({ subject, doneCount }) {
  const total = subject.chapters.length;
  const percent = Math.round((doneCount / total) * 100);

  return (
    <Link to={subject.path} className="cover" style={{ '--c': subject.color }}>
      <span className="cover-band" aria-hidden="true" />
      <div className="cover-top">
        <span className="cover-no">No. {pad(subject.number)}</span>
        {doneCount > 0 && <span className="cover-done">{doneCount === total ? 'finished' : `${percent}% read`}</span>}
      </div>
      <div className="cover-label">
        <h3>{subject.title}</h3>
        {subject.topics.length > 0 && <p>{subject.topics.join(' · ')}</p>}
      </div>
      <div className="cover-foot">
        <span>
          {total} {total === 1 ? 'chapter' : 'chapters'} · {formatMinutes(subject.minutes)}
        </span>
        <span className="cover-progress" aria-label={`${doneCount} of ${total} chapters done`}>
          <span style={{ width: `${percent}%` }} />
        </span>
      </div>
    </Link>
  );
}
