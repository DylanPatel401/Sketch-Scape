import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainScreen from './pages/MainScreen';
import JoinParty from './pages/JoinParty';
import CreateParty from './pages/CreateParty';
import PlayGame from './pages/PlayGame';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/join" element={<JoinParty />} />
        <Route path="/create" element={<CreateParty />} />
        <Route path="/play" element={<PlayGame />} />
      </Routes>
    </Router>
  );
}

export default App;
