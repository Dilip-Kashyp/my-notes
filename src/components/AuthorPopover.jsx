import { useState } from 'react';

function getAuthorDetails(author) {
  if (!author) {
    return null;
  }

  return typeof author === 'string' ? { name: author } : author;
}

export function AuthorPopover({ author }) {
  const [isOpen, setIsOpen] = useState(false);
  const details = getAuthorDetails(author);

  if (!details?.name) {
    return null;
  }

  const links = [
    { label: 'Email', value: details.email, href: details.email ? `mailto:${details.email}` : null },
    { label: 'LinkedIn', value: details.linkedin, href: details.linkedin },
    { label: 'GitHub', value: details.github, href: details.github },
  ].filter((link) => link.value && link.href);

  function togglePopover(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsOpen((open) => !open);
  }

  return (
    <div className="author-popover-wrapper">
      <button
        type="button"
        className="author-button"
        onClick={togglePopover}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {details.name}
      </button>
      {isOpen && (
        <div className="author-popover" role="dialog" aria-label={`Contact ${details.name}`}>
          <div className="author-popover-header">
            <strong>{details.name}</strong>
            <button type="button" className="author-popover-close" onClick={() => setIsOpen(false)} aria-label="Close author details">
              ×
            </button>
          </div>
          {links.length > 0 ? (
            <ul>
              {links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} target={link.label === 'Email' ? undefined : '_blank'} rel={link.label === 'Email' ? undefined : 'noreferrer'}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>No contact links have been added yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
