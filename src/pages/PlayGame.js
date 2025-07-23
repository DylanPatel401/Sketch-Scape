import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot, setDoc, updateDoc, deleteField } from "firebase/firestore";

import { FIREBASE_AUTH, FIRESTORE_DB } from "../firebase/firebase";
import trashIcon from "../assets/trash.png";
import ChatBox from "../components/chat";
import { getRandomWords } from "../components/wordUtil";

const COLORS = [
  "#000000", "#808080", "#FF0000", "#FFA500", "#FFFF00", "#00FF00",
  "#00FFFF", "#0000FF", "#800080", "#FFC0CB", "#A0522D", "#FFFFFF"
];

const ROUND_DURATION = 9;

const PlayGame = () => {
  const { partycode } = useParams();
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  const [paths, setPaths] = useState([]);
  const [userId, setUserId] = useState(null);
  const [partyData, setPartyData] = useState(null);
  const [currentDrawer, setCurrentDrawer] = useState(null);
  const [selectedWord, setSelectedWord] = useState("");
  const [wordChoices, setWordChoices] = useState([]);
  const [timer, setTimer] = useState(ROUND_DURATION);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    const unregister = FIREBASE_AUTH.onAuthStateChanged((user) => {
      if (user) setUserId(user.uid);
    });
    return () => unregister();
  }, []);

  useEffect(() => {
    if (!partycode || !userId) return;

    const partyRef = doc(FIRESTORE_DB, "parties", partycode);
    const drawingRef = doc(FIRESTORE_DB, "parties", partycode, "canvas", "drawing");

    const unsubscribeParty = onSnapshot(partyRef, async (snap) => {
      const data = snap.data();
      setPartyData(data);
      setCurrentDrawer(data?.currentDrawer || null);

      if (data?.status === "finished") {
        setGameFinished(true);
      }

      if (data?.currentDrawer === userId && !data?.currentWord) {
        const choices = await getRandomWords(3);
        setWordChoices(Array.isArray(choices) ? choices : []);
      }

      if (data?.currentWord && data?.currentDrawer === userId) {
        setSelectedWord(data.currentWord);
      }
    });

    const unsubscribeDrawing = onSnapshot(drawingRef, (snap) => {
      const data = snap.data();
      if (data?.paths) {
        setPaths(data.paths);
        drawPaths(data.paths);
      }
    });

    return () => {
      unsubscribeParty();
      unsubscribeDrawing();
    };
  }, [partycode, userId]);

  useEffect(() => {
    if (!selectedWord || timer === 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (userId === currentDrawer) rotateDrawer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedWord, userId, currentDrawer]);

  useEffect(() => {
    const cleanupOnLeave = async () => {
    if (!partycode || !userId) return;

    const partyRef = doc(FIRESTORE_DB, "parties", partycode);
    const partySnap = await partyRef.get();
    const party = partySnap.data();

    if (!party?.members?.[userId]) return;

    // Remove user from members and hasDrawnMap
    await updateDoc(partyRef, {
      [`members.${userId}`]: deleteField(),
      [`hasDrawnMap.${userId}`]: deleteField(),
      [`scores.${userId}`]: deleteField(),
    });
  };

  window.addEventListener("beforeunload", cleanupOnLeave);
  return () => {
    window.removeEventListener("beforeunload", cleanupOnLeave);
  };
}, [partycode, userId]);

  useEffect(() => {
    if (
      partyData &&
      partyData.status === "in-progress" &&
      !partyData.hasDrawnMap &&
      userId === partyData.hostId // Only host initializes this
    ) {
      const initMap = {};
      Object.keys(partyData.members).forEach(uid => {
        initMap[uid] = false;
      });

      const partyRef = doc(FIRESTORE_DB, "parties", partycode);
      updateDoc(partyRef, {
        hasDrawnMap: initMap,
        currentDrawer: Object.keys(partyData.members)[0],
        roundCount: 1,
        currentWord: null,
        guessedPlayers: {},
      });
    }
  }, [partyData, userId]);
    
  const rotateDrawer = async () => {
    if (!partyData || !partyData.members) return;

    const partyRef = doc(FIRESTORE_DB, "parties", partycode);
    const memberIds = Object.keys(partyData.members);
    const drawnMap = partyData.hasDrawnMap || {};

    // Mark currentDrawer as having drawn
    drawnMap[currentDrawer] = true;

    // Find next undrawn player
    const nextDrawer = memberIds.find(uid => !drawnMap[uid]);

    if (nextDrawer) {
      // Continue current round
      await updateDoc(partyRef, {
        currentDrawer: nextDrawer,
        currentWord: null,
        guessedPlayers: {},
        hasDrawnMap: drawnMap,
      });
    } else {
      // All players have drawn, reset map and increment round
      const newMap = {};
      memberIds.forEach(uid => newMap[uid] = false);

      const isLastRound = (partyData.roundCount || 1) >= partyData.maxRounds;

      if (isLastRound) {
        await updateDoc(partyRef, {
          status: "finished",
          currentDrawer: null,
          currentWord: null,
        });
        return;
      }

      await updateDoc(partyRef, {
        currentDrawer: memberIds[0],
        currentWord: null,
        guessedPlayers: {},
        roundCount: (partyData.roundCount || 1) + 1,
        hasDrawnMap: newMap,
      });
    }

    // Clear the canvas
    const drawingRef = doc(FIRESTORE_DB, "parties", partycode, "canvas", "drawing");
    await setDoc(drawingRef, {
      paths: [],
      lastUpdated: new Date().toISOString()
    });

    setSelectedWord("");
    setPaths([]);
    setTimer(ROUND_DURATION);
  };

  const drawPaths = (paths) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    paths.forEach((segment) => {
      if (!segment?.points || segment.points.length < 2) return;
      ctx.strokeStyle = segment.color;
      ctx.lineWidth = segment.size;
      ctx.beginPath();
      for (let i = 1; i < segment.points.length; i++) {
        const from = segment.points[i - 1];
        const to = segment.points[i];
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
      }
      ctx.stroke();
    });
  };

  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e) => {
    if (!isDrawingTurn || !selectedWord) return;
    isDrawing.current = true;
    const point = getCoords(e);
    const newSegment = {
      color: isEraser ? "#FFFFFF" : currentColor,
      size: isEraser ? 16 : brushSize,
      points: [point],
    };
    updateDrawing([...paths, newSegment]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawingTurn || !isDrawing.current || !selectedWord) return;
    const point = getCoords(e);
    const updated = [...paths];
    updated[updated.length - 1].points.push(point);
    updateDrawing(updated);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const updateDrawing = async (newPaths) => {
    setPaths(newPaths);
    const drawingRef = doc(FIRESTORE_DB, "parties", partycode, "canvas", "drawing");
    await setDoc(drawingRef, { paths: newPaths, lastUpdated: new Date().toISOString() });
  };

  const handleWordSelect = async (word) => {
    setSelectedWord(word);
    const partyRef = doc(FIRESTORE_DB, "parties", partycode);
    await updateDoc(partyRef, { currentWord: word });
  };

  const isDrawingTurn = userId === currentDrawer && timer > 0;

  const getWinnerName = () => {
    if (!partyData?.scores || !partyData?.members) return "";

    const maxScore = Math.max(...Object.values(partyData.scores));
    const topPlayers = Object.entries(partyData.scores)
      .filter(([_, score]) => score === maxScore)
      .map(([uid]) => partyData.members[uid]?.displayName || "Anonymous");

    return topPlayers.length > 1
      ? `Tie: ${topPlayers.join(" & ")}`
      : topPlayers[0];
  };


  return (
    <div style={{ textAlign: "center" }}>
      {gameFinished && (
        <div style={{ background: "#dff0d8", padding: 20, borderRadius: 8, margin: 16 }}>
          <h2>🎉 Game Over!</h2>
          <p>🏆 Winner: <strong>{getWinnerName()}</strong></p>
        </div>
      )}

      {partyData?.roundCount && partyData?.maxRounds && (
        <h3>Round {partyData.roundCount} of {partyData.maxRounds}</h3>
      )}

      <h2>🎮 Game in Progress</h2>
      <p>{isDrawingTurn ? `You're drawing ${selectedWord ? `(${selectedWord})` : ""}` : "Waiting for the artist..."}</p>

      {isDrawingTurn && !selectedWord && (
        <div>
          <h3>Pick a word to draw:</h3>
          {wordChoices.map((word) => (
            <button key={word} onClick={() => handleWordSelect(word)}>{word}</button>
          ))}
        </div>
      )}

      {isDrawingTurn && selectedWord && <p>⏳ Time left: <strong>{timer}s</strong></p>}

      {isDrawingTurn && selectedWord && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, gap: 6, flexWrap: "wrap" }}>
          {COLORS.map((color) => (
            <div
              key={color}
              onClick={() => { setCurrentColor(color); setIsEraser(false); }}
              style={{
                width: 24,
                height: 24,
                backgroundColor: color,
                border: currentColor === color && !isEraser ? "2px solid black" : "1px solid gray",
                cursor: "pointer"
              }}
            />
          ))}
          <button onClick={() => setIsEraser(true)}>🧽 Eraser</button>
          <select value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))}>
            <option value={2}>Thin</option>
            <option value={4}>Normal</option>
            <option value={8}>Thick</option>
          </select>
          <button onClick={() => updateDrawing(paths.slice(0, -1))}>↩️ Undo</button>
          <button onClick={() => updateDrawing([])}>
            <img src={trashIcon} alt="Clear" style={{ width: 20, height: 20 }} />
          </button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16 }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          style={{ border: "2px solid black", backgroundColor: "white", cursor: isDrawingTurn && selectedWord ? "crosshair" : "not-allowed" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        <div style={{ width: 300, height: 500, border: "1px solid #ccc", borderRadius: 8, overflow: "hidden" }}>
          <ChatBox
            gameId={partycode}
            userId={userId}
            currentWord={partyData?.currentWord || ""}
            currentDrawer={partyData?.currentDrawer}
            timer={timer}
          />
        </div>
      </div>

      {partyData?.members && partyData?.scores && (
        <div style={{ position: "absolute", top: 16, right: 16, background: "#f5f5f5", padding: 10, borderRadius: 8 }}>
          <h4>🏆 Scoreboard</h4>
          {Object.entries(partyData.members).map(([uid, member]) => (
            <div key={uid}>{member.displayName || "Anonymous"}: {partyData.scores?.[uid] || 0} pts</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayGame;
