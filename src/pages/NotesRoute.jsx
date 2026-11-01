import { Link, useParams } from 'react-router-dom';
import { resolveRoute } from '../lib/notebook';
import { NotePage } from './NotePage';
import { SubjectPage } from './SubjectPage';

export function NotFoundPage() {
  return (
    <div className="page not-found">
      <div className="torn-page">
        <p className="hand">this page seems to have been torn out…</p>
        <h1>Page not found</h1>
        <p>The notebook or chapter you were looking for doesn’t exist, or its address changed.</p>
        <Link to="/" className="btn btn-primary">Back to the shelf</Link>
      </div>
    </div>
  );
}

export function NotesRoute() {
  const { topic, chapter: chapterId } = useParams();
  const match = resolveRoute(topic, chapterId);

  if (!match) {
    return <NotFoundPage />;
  }
  if (!match.chapter) {
    return <SubjectPage subject={match.subject} />;
  }
  return <NotePage key={match.chapter.path} subject={match.subject} chapter={match.chapter} />;
}
