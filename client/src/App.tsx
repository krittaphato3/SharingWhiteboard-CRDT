import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Lobby } from './pages/Lobby';
import { WhiteboardPage } from './pages/Whiteboard';
import { AdminPage } from './pages/Admin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/room/:roomId" element={<WhiteboardPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
