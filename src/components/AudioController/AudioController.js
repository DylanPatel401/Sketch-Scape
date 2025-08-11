import React, { useContext } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { AudioContext } from '../../contexts/AudioContext';
import './AudioController.css';

const AudioController = () => {
  const { isPlaying, togglePlay, volume, setVolume, hasUserInteracted } = useContext(AudioContext);

  return (
    <div className={`audio-controller ${!hasUserInteracted ? 'audio-disabled' : ''}`}>
      <button onClick={togglePlay} aria-label={isPlaying ? "Pause music" : "Play music"}>
        {isPlaying ? <FaPause /> : <FaPlay />}
      </button>
      
      {volume > 0 ? <FaVolumeUp /> : <FaVolumeMute />}
      
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        className="volume-slider"
      />
      
      {!hasUserInteracted && (
        <span className="audio-blocked-warning">Click anywhere to enable audio</span>
      )}
    </div>
  );
};

export default AudioController;
