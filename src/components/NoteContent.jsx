import { isValidElement } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { rehypeHeadingIds } from '../lib/notebook';
import { CodeBlock } from './CodeBlock';
import { MermaidDiagram } from './MermaidDiagram';

// react-markdown passes its syntax-tree `node` to every component; keep it off the DOM
function withoutNode(props) {
  const domProps = { ...props };
  delete domProps.node;
  return domProps;
}

// "3. Static routes" -> number "3" in the page margin, text "Static routes"
function splitSectionNumber(children) {
  const list = Array.isArray(children) ? children : [children];
  const match = typeof list[0] === 'string' ? list[0].match(/^(\d+(?:\.\d+)*)\.?\s+/) : null;
  if (!match) {
    return { number: null, rest: children };
  }
  return { number: match[1], rest: [list[0].slice(match[0].length), ...list.slice(1)] };
}

const components = {
  h2(props) {
    const { number, rest } = splitSectionNumber(props.children);
    return (
      <h2 {...withoutNode(props)}>
        {number && <span className="section-num">{number}</span>}
        {rest}
      </h2>
    );
  },
  pre({ children }) {
    if (!isValidElement(children)) {
      return <pre>{children}</pre>;
    }
    const language = /language-([\w-]+)/.exec(children.props.className || '')?.[1] ?? '';
    const code = String(children.props.children ?? '').replace(/\n$/, '');
    if (language === 'mermaid') {
      return <MermaidDiagram chart={code} />;
    }
    return <CodeBlock language={language} code={code} />;
  },
  table(props) {
    return (
      <div className="table-wrap">
        <table {...withoutNode(props)} />
      </div>
    );
  },
  a(props) {
    const external = /^https?:\/\//.test(props.href ?? '');
    return <a {...withoutNode(props)} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} />;
  },
};

export function NoteContent({ markdown }) {
  return (
    <div className="prose">
      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHeadingIds]} components={components}>
        {markdown}
      </Markdown>
    </div>
  );
}
