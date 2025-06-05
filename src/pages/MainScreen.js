import React, { useEffect, useState } from 'react';
import cloudImage from '../assets/cloud.png';
import { createParty } from '../firebase/test';
import { useNavigate } from 'react-router-dom';
import '../css/MainScreen.css';
import { getAuth, signInAnonymously } from 'firebase/auth';

const MainScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Automatically sign in anonymously on first load
  useEffect(() => {
    const auth = getAuth();

    if (!localStorage.getItem('userId')) {
      signInAnonymously(auth)
        .then((userCredential) => {
          const uid = userCredential.user.uid;
          localStorage.setItem('userId', uid);
          localStorage.setItem('displayName', 'Anonymous');
        })
        .catch((err) => {
          console.error('Anonymous sign-in failed:', err);
          setError('Failed to sign in anonymously.');
        });
    }
  }, []);

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

  const handleCreateParty = async () => {
    setLoading(true);
    setError(null);

    const userId = localStorage.getItem('userId');
    const displayName = localStorage.getItem('displayName') || 'Host';

    try {
      const code = await createParty({
        mode: 'classic',
        hostId: userId,
        members: {
          [userId]: {
            displayName,
            isHost: true,
          },
        },
      });

      navigate(`/lobby/${code}`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error creating party');
    } finally {
      setLoading(false);
    }
  };

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
