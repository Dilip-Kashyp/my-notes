import { useEffect, useId, useState } from 'react';
import { useTheme } from '../lib/theme';

let mermaidPromise;

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(({ default: mermaid }) => mermaid);
  }
  return mermaidPromise;
}

// Diagrams are drawn in mermaid's hand-drawn style so they look sketched into the notebook.
function configFor(theme) {
  return {
    startOnLoad: false,
    securityLevel: 'strict',
    look: 'handDrawn',
    theme: theme === 'dark' ? 'dark' : 'neutral',
    fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
    themeVariables: theme === 'dark' ? { background: 'transparent' } : { background: 'transparent', primaryColor: '#fffdf8' },
  };
}

// Mermaid writes the diagram's natural width as an inline max-width; phones use it to avoid shrinking text
function diagramWidth(svg) {
  const width = /max-width:\s*([\d.]+)px/.exec(svg)?.[1];
  return width ? { '--diagram-width': `${width}px` } : undefined;
}

export function MermaidDiagram({ chart }) {
  const id = `mermaid-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  const theme = useTheme();
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    loadMermaid()
      .then((mermaid) => {
        mermaid.initialize(configFor(theme));
        return mermaid.render(id, chart);
      })
      .then(({ svg: rendered }) => {
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, chart, theme]);

  if (error) {
    return <pre className="mermaid-error">{chart}</pre>;
  }

  return (
    <figure className="figure">
      <span className="figure-tape figure-tape-left" aria-hidden="true" />
      <span className="figure-tape figure-tape-right" aria-hidden="true" />
      {svg ? (
        <div className="figure-body" style={diagramWidth(svg)} dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="figure-body figure-loading">sketching diagram…</div>
      )}
    </figure>
  );
}
