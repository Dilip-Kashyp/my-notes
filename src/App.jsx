import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useSearchParams } from 'react-router-dom';
import { LandingPage, NotesRoute, NotFoundPage } from "./pages";
import { TopBar } from './components/TopBar';
import { SearchPalette } from './components/SearchPalette';

// New page: start at the top. Link with #section: scroll to that heading.
function useScrollOnNavigate() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) {
      target.scrollIntoView();
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname, hash]);
}

function App() {
  const [searchOpen, setSearchOpen] = useState(false);
  // "/?q=caching" opens search pre-filled (matches the SearchAction in index.html)
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q');
  useScrollOnNavigate();

  function closeSearch() {
    setSearchOpen(false);
    if (urlQuery !== null) {
      setSearchParams((params) => {
        params.delete('q');
        return params;
      }, { replace: true });
    }
  }

  useEffect(() => {
    const onKeyDown = (event) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((open) => !open);
      } else if (event.key === '/' && !typing) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <TopBar onSearch={() => setSearchOpen(true)} />
      <main className="app-main" id="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<LandingPage onSearch={() => setSearchOpen(true)} />} />
          <Route path="/notes/:topic" element={<NotesRoute />} />
          <Route path="/notes/:topic/:chapter" element={<NotesRoute />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <span>Spotted a mistake? Pull requests are welcome.</span>
      </footer>
      {(searchOpen || urlQuery !== null) && <SearchPalette initialQuery={urlQuery ?? ''} onClose={closeSearch} />}
    </>
  );
}

export default App;
