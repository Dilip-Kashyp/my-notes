import { Link, useLocation } from 'react-router-dom';
import { resolveRoute } from '../lib/notebook';
import { toggleTheme, useTheme } from '../lib/theme';
import { MoonIcon, NotebookIcon, SearchIcon, SunIcon } from './Icons';

const SHORTCUT = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘K' : 'Ctrl K';

function useBreadcrumb() {
  const { pathname } = useLocation();
  const [, section, topic, chapterId] = pathname.split('/');
  const match = section === 'notes' ? resolveRoute(topic, chapterId) : null;
  if (!match) {
    return [];
  }
  const crumbs = [{ label: match.subject.title, path: match.subject.path, color: match.subject.color }];
  if (match.subject.isSeries && match.chapter) {
    crumbs.push({ label: match.chapter.title, path: match.chapter.path });
  }
  return crumbs;
}

export function TopBar({ onSearch }) {
  const theme = useTheme();
  const crumbs = useBreadcrumb();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand" aria-label="Engineering Notebook, home">
          <span className="brand-mark"><NotebookIcon size={20} /></span>
          <span className="brand-name">Engineering <em>Notebook</em></span>
        </Link>

        {crumbs.length > 0 && (
          <nav className="crumbs" aria-label="Breadcrumb">
            {crumbs.map((crumb, index) => (
              <span key={crumb.path} className="crumb">
                <span className="crumb-sep" aria-hidden="true">/</span>
                {index === crumbs.length - 1 ? (
                  <span aria-current="page" style={crumb.color ? { '--c': crumb.color } : undefined}>{crumb.label}</span>
                ) : (
                  <Link to={crumb.path} style={crumb.color ? { '--c': crumb.color } : undefined}>{crumb.label}</Link>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className="topbar-actions">
          <button type="button" className="search-trigger" onClick={onSearch}>
            <SearchIcon size={16} />
            <span className="search-trigger-label">Search notes</span>
            <kbd>{SHORTCUT}</kbd>
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to paper (light) theme' : 'Switch to blueprint (dark) theme'}
            title={theme === 'dark' ? 'Paper theme' : 'Blueprint theme'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}
