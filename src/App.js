import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainScreen from './pages/MainScreen';
import JoinParty from './pages/JoinParty';
import PlayGame from './pages/PlayGame';
import Lobby from './pages/Lobby';
import { AudioProvider } from './contexts/AudioContext';
import AudioController from './components/AudioController/AudioController';

function App() {
  return (
    <AudioProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainScreen />} />
          <Route path="/join" element={<JoinParty />} />
          <Route path="/play" element={<PlayGame />} />
          <Route path="/play/:partycode" element={<PlayGame />} />
          <Route path="/lobby/:partyCode" element={<Lobby />} />
        </Routes>
        <AudioController />
      </Router>
    </AudioProvider>
  );
}

export default App;
