import { Link } from 'react-router-dom';
import { allNotes } from '../notes';

function LandingPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 2rem' }}>
      <h1 style={{ fontSize: '4.5rem', lineHeight: '1.1', marginBottom: '1.5rem' }}>
        My Engineering <br />
        <span className="text-red text-italic">Notes.</span>
      </h1>

      <p style={{ maxWidth: '650px', marginBottom: '2.5rem' }}>
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
            <Link to={`/notes/${note.id}`} key={note.id} className="note-card">
              <div className="note-card-content">
                <div className="note-number">{numberString}</div>
                <div className="note-details">
                  <h2>{note.metadata.title}</h2>
                  <p>{note.metadata.description}</p>
                </div>
              </div>
              <div className="note-arrow">→</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export { LandingPage };
