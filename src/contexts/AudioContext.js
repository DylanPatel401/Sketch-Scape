import { createContext, useState, useEffect, useRef, useMemo } from 'react';

export const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Memoize the audio path to prevent recreation on every render
  const audioPath = useMemo(() => '/audio/Japanese RnB.mp3', []);

  // Initialize audio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioPath);
      audioRef.current.volume = volume;
      audioRef.current.loop = true;
    }

    const handleInteraction = () => {
      setHasUserInteracted(true);
      // Try to play immediately when user interacts
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(e => console.log("Autoplay blocked:", e));
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      audioRef.current.pause();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [audioPath, volume]); // Proper dependencies

  const togglePlay = () => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(e => {
          console.error("Playback failed:", e);
          // Show visual feedback that user needs to interact first
          setHasUserInteracted(false);
        });
    }
  };

  const setAudioVolume = (newVolume) => {
    const vol = Math.max(0, Math.min(1, newVolume));
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  return (
    <AudioContext.Provider value={{
      isPlaying,
      togglePlay,
      volume,
      setVolume: setAudioVolume,
      hasUserInteracted
    }}>
      {children}
    </AudioContext.Provider>
  );
};
