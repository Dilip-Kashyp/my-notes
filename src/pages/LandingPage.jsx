import { Link } from 'react-router-dom';
import { allNotes } from '../notes';
import { AuthorPopover } from '../components/AuthorPopover';

function LandingPage() {
  return (
    <div className="landing-container">
      <h1 className="landing-title">
        My Engineering <br />
        <span className="text-red text-italic">Notes.</span>
      </h1>

      <p className="landing-subtitle">
        Welcome to my Engineering Notes. This is a collection of my notes on various topics related to engineering.
        If you feel bored you can contribute to my notes.
        You can also suggest changes and improvements to my notes. just raise a Pull Request.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
        <button className="pill"><span className="text-red" style={{ fontWeight: '600' }}>{allNotes.length}</span> chapters</button>
        <button className="pill">Python</button>
        <button className="pill">code + theory</button>
      </div>

      <div className="notes-list">
        {allNotes.map((note, index) => {
          const numberString = (index + 1).toString().padStart(2, '0');
          return (
            <div key={note.id} className="note-card">
              <Link to={`/notes/${note.id}`} className="note-card-link">
                <div className="note-card-content">
                  <div className="note-number">{numberString}</div>
                  <div className="note-details">
                    <h2>{note.metadata.title}</h2>
                    <p>{note.metadata.description}</p>
                  </div>
                </div>
                <div className="note-arrow">→</div>
              </Link>
              <AuthorPopover author={note.metadata.author} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { LandingPage };
