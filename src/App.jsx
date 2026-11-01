import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
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
  useScrollOnNavigate();

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
      <TopBar onSearch={() => setSearchOpen(true)} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/notes/:topic" element={<NotesRoute />} />
          <Route path="/notes/:topic/:chapter" element={<NotesRoute />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <span>Spotted a mistake? Pull requests are welcome.</span>
      </footer>
      {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} />}
    </>
  );
}

export default App;
