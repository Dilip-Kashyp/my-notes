import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { allNotes } from '../notes';
import { AuthorPopover } from '../components/AuthorPopover';

function generateId(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function NotePage() {
  const { topic } = useParams();
  const noteData = allNotes.find(n => n.id === topic);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const headings = useMemo(() => {
    if (!noteData?.notes) {
      return [];
    }

    const extractedHeadings = [];
    const lines = noteData.notes.split('\n');
    let h2Count = 0;
    let h3Count = 0;
    for (const line of lines) {
      const match = line.match(/^(#{2,3})\s+(.*)/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        let numberStr = '';
        if (level === 2) {
          h2Count++;
          h3Count = 0;
          numberStr = `${h2Count}.`;
        } else if (level === 3) {
          h3Count++;
          numberStr = `${h2Count}.${h3Count}.`;
        }

        extractedHeadings.push({
          level,
          text,
          id: generateId(text),
          numberStr
        });
      }
    }
    return extractedHeadings;
  }, [noteData]);

  if (!noteData) {
    return <div>Note not found</div>;
  }

  return (
    <div className="note-page-container">
      <div className="note-sidebar-wrapper">
        <Link to="/" className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', textDecoration: 'none', color: 'inherit' }}>
          <span>←</span> Back to Notes
        </Link>

        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? '✕ Close Contents' : '☰ Contents'}
        </button>

        <aside className={`note-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
          <h3>Contents</h3>
          <ul>
            {headings.map((h, i) => (
              <li key={i} style={{ paddingLeft: h.level === 3 ? '1rem' : '0' }}>
                <a href={`#${h.id}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <span style={{ marginRight: '0.4rem', color: 'var(--fg-muted)', fontSize: '0.9em' }}>{h.numberStr}</span>
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <main className="note-content">
        <h1>{noteData.metadata.title}</h1>
        <div className="note-author">
          <span>Written by</span>
          <AuthorPopover author={noteData.metadata.author} />
        </div>
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2(props) {
              const id = generateId(props.children?.toString() || '');
              return <h2 id={id} {...props} />
            },
            h3(props) {
              const id = generateId(props.children?.toString() || '');
              return <h3 id={id} {...props} />
            },
            code({ inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            }
          }}
        >
          {noteData.notes}
        </Markdown>
      </main>
    </div>
  );
}
