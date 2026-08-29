import { Routes, Route } from 'react-router-dom';
import { LandingPage } from "./pages";
import { NotePage } from "./pages/NotePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/notes/:topic" element={<NotePage />} />
    </Routes>
  );
}

export default App;
