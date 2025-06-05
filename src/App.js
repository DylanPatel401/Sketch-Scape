import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainScreen from './pages/MainScreen';
import JoinParty from './pages/JoinParty';
import PlayGame from './pages/PlayGame';
import Lobby from "./pages/Lobby";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/join" element={<JoinParty />} />
        <Route path="/play" element={<PlayGame />} />
        <Route path="/play/:partycode" element={<PlayGame />} />
        <Route path="/lobby/:partyCode" element={<Lobby />} />
      
      </Routes>
    </Router>
  );
}

export default App;
