import React from 'react';
import { useNavigate } from 'react-router-dom';
import cloudImage from '../assets/cloud.png';
import '../css/MainScreen.css';

const MainScreen = () => {
  const navigate = useNavigate();

  const raindrops = Array.from({ length: 30 }, (_, i) => {
    const left = Math.random() * 100;
    const animationDuration = 2 + Math.random() * 3;
    const color = ['#FF6B6B', '#6BCB77', '#4D96FF', '#FFD93D', '#C780FA'][i % 5];

    return (
      <div
        key={i}
        className="raindrop"
        style={{
          left: `${left}%`,
          animationDuration: `${animationDuration}s`,
          backgroundColor: color,
        }}
      />
    );
  });

  return (
    <div className="MainScreen">
      <div className="clouds">
        <img src={cloudImage} alt="cloud" className="cloud" />
        <img src={cloudImage} alt="cloud" className="cloud" />
      </div>
      <div className="raindrop-container">{raindrops}</div>
      <h1>Welcome to Sketch Scape</h1>
      <p>Join a party or create your own to start drawing!</p>
      <div className="button-group">
        <button onClick={() => navigate('/play')}>Play</button>
        <button onClick={() => navigate('/join')}>Join Party</button>
        <button onClick={() => navigate('/create')}>Create Party</button>
      </div>
    </div>
  );
};

export default MainScreen;
