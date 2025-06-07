import React, { useEffect, useState } from 'react';
import cloudImage from '../assets/cloud.png';
import { createParty } from '../firebase/functions';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { updateUserDisplayName } from '../firebase/functions'
import '../css/MainScreen.css';

const MainScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [displayName, setDisplayName] = useState('Anonymous');

  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const existingId = localStorage.getItem('userId');

    if (!existingId) {
      signInAnonymously(auth)
        .then(async (userCredential) => {
          const uid = userCredential.user.uid;
          localStorage.setItem('userId', uid);
          localStorage.setItem('displayName', 'Anonymous');
          setDisplayName('Anonymous');
          await updateUserDisplayName(uid, 'Anonymous');
        })
        .catch((err) => {
          console.error('Anonymous sign-in failed:', err);
          setError('Failed to sign in anonymously.');
        });
    } else {
      const savedName = localStorage.getItem('displayName') || 'Anonymous';
      setDisplayName(savedName);
      updateUserDisplayName(existingId, savedName);
    }
  }, []);


  const handleDisplayNameChange = async (e) => {
    const name = e.target.value;
    setDisplayName(name);
    localStorage.setItem('displayName', name);

    const userId = localStorage.getItem('userId');
    if (userId) {
      await updateUserDisplayName(userId, name);
    }
  };

  const handleCreateParty = async () => {
    setLoading(true);
    setError(null);

    try {
      const code = await createParty('classic');

      navigate(`/lobby/${code}`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error creating party');
    } finally {
      setLoading(false);
    }
  };

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
        <img src={cloudImage} alt="cloud" className="cloud" />
      </div>

      <div className="raindrop-container">{raindrops}</div>

      <h1>Welcome to Sketch Scape</h1>
      <p>Join a party or create your own to start drawing!</p>

      <div className="name-entry">
        <label htmlFor="name">Display Name</label>
        <input
          id="name"
          type="text"
          maxLength={16}
          value={displayName}
          onChange={handleDisplayNameChange}
          placeholder="Enter your name"
          className="name-input"
        />
      </div>

      <div className="button-group">
        <button onClick={() => navigate('/play')}>Play</button>
        <button onClick={() => navigate('/join')}>Join Party</button>
        <button onClick={handleCreateParty} disabled={loading}>
          {loading ? 'Creating...' : 'Create Party'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default MainScreen;
