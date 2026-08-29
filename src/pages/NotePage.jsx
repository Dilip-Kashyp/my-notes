import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { allNotes } from '../notes';

function generateId(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function NotePage() {
  const { topic } = useParams();
  const noteData = allNotes.find(n => n.id === topic);
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    if (noteData && noteData.notes) {
      const extractedHeadings = [];
      const lines = noteData.notes.split('\n');
      for (const line of lines) {
        const match = line.match(/^(#{2,3})\s+(.*)/);
        if (match) {
          extractedHeadings.push({
            level: match[1].length,
            text: match[2],
            id: generateId(match[2])
          });
        }
      }
      setHeadings(extractedHeadings);
    }
  }, [noteData]);

  if (!noteData) {
    return <div>Note not found</div>;
  }

  return (
    <div className="note-page-container">
      <aside className="note-sidebar">
        <Link to="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>Back to Notes</Link>
        <h3>Contents</h3>
        <ul>
          {headings.map((h, i) => (
            <li key={i} style={{ paddingLeft: h.level === 3 ? '1rem' : '0' }}>
              <a href={`#${h.id}`}>{h.text}</a>
            </li>
          ))}
        </ul>
      </aside>

      <main className="note-content">
        <h1>{noteData.metadata.title}</h1>
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
            code({ node, inline, className, children, ...props }) {
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
