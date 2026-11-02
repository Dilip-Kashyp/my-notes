import { useState } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import docker from 'react-syntax-highlighter/dist/esm/languages/prism/docker';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import graphql from 'react-syntax-highlighter/dist/esm/languages/prism/graphql';
import hcl from 'react-syntax-highlighter/dist/esm/languages/prism/hcl';
import http from 'react-syntax-highlighter/dist/esm/languages/prism/http';
import ini from 'react-syntax-highlighter/dist/esm/languages/prism/ini';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import protobuf from 'react-syntax-highlighter/dist/esm/languages/prism/protobuf';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import { CheckIcon, CopyIcon } from './Icons';

// Only the languages the notes use are bundled; anything else renders as plain text.
// To highlight a new language, import it from prism/ above and register it here.
const LANGUAGES = {
  bash, sh: bash, shell: bash, env: bash,
  docker, dockerfile: docker,
  go, graphql, hcl, http, ini,
  javascript, js: javascript, jsx,
  json, protobuf, proto: protobuf, python, py: python, sql,
  typescript, ts: typescript,
  yaml, yml: yaml,
};

Object.entries(LANGUAGES).forEach(([name, language]) => SyntaxHighlighter.registerLanguage(name, language));

export function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <figure className="code-card">
      <figcaption className="code-card-head">
        <span className="code-lang">{language || 'text'}</span>
        <button type="button" className="code-copy" onClick={copy} aria-label="Copy code">
          {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </figcaption>
      <SyntaxHighlighter
        language={LANGUAGES[language] ? language : 'text'}
        style={vscDarkPlus}
        PreTag="div"
        customStyle={{ margin: 0, padding: '1rem 1.25rem 1.15rem', background: 'transparent', fontSize: '0.86rem' }}
        codeTagProps={{ style: { fontFamily: 'var(--font-mono)', background: 'transparent' } }}
      >
        {code}
      </SyntaxHighlighter>
    </figure>
  );
}
