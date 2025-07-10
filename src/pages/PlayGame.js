import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
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

  useEffect(() => {
    const unregister = FIREBASE_AUTH.onAuthStateChanged((user) => {
      if (user) setUserId(user.uid);
      getRandomWords().then(console.log);

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

      if (data?.currentDrawer === userId && !data?.currentWord) {
        const choices = await getWordChoices();
        setWordChoices(Array.isArray(choices) ? choices : []);
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

    const interval = setInterval(async () => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);

          if (userId === currentDrawer) {
            rotateDrawer();
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedWord, userId, currentDrawer]);


  const getWordChoices = async () => {
    try {
      const words = await getRandomWords(3);
      return words;
    } catch (err) {
      console.error("Failed to get random words:", err);
      return [];
    }
  };

  const rotateDrawer = async () => {
    if (!partyData || !partyData.members) return;

    const memberIds = Object.keys(partyData.members);
    const currentIndex = memberIds.indexOf(currentDrawer);
    const nextIndex = (currentIndex + 1) % memberIds.length;
    const nextDrawer = memberIds[nextIndex];

    const partyRef = doc(FIRESTORE_DB, "parties", partycode);
    await updateDoc(partyRef, {
      currentDrawer: nextDrawer,
      currentWord: null,
      guessedPlayers: {},  
    });

    const drawingRef = doc(FIRESTORE_DB, "parties", partycode, "canvas", "drawing");
    await setDoc(drawingRef, {
      paths: [],
      lastUpdated: new Date().toISOString(),
    });

    setSelectedWord("");
    setPaths([]);
  };


  const renderScoreboard = () => {
    if (!partyData?.members || !partyData?.scores) return null;

    return (
      <div style={{ position: "absolute", top: 16, right: 16, textAlign: "left", background: "#f5f5f5", padding: "10px", borderRadius: "8px", boxShadow: "0 0 5px rgba(0,0,0,0.2)" }}>
        <h4 style={{ marginTop: 0 }}>🏆 Scoreboard</h4>
        {Object.entries(partyData.members).map(([uid, member]) => (
          <div key={uid}>
            {member.displayName || "Anonymous"}: {partyData.scores?.[uid] || 0} pts
          </div>
        ))}
      </div>
    );
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
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
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
    const newPaths = [...paths, newSegment];
    updateDrawing(newPaths);
  };

  const handleMouseMove = (e) => {
    if (!isDrawingTurn || !isDrawing.current || !selectedWord) return;
    const point = getCoords(e);
    const updatedPaths = [...paths];
    updatedPaths[updatedPaths.length - 1].points.push(point);
    updateDrawing(updatedPaths);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const updateDrawing = async (newPaths) => {
    setPaths(newPaths);
    const drawingRef = doc(FIRESTORE_DB, "parties", partycode, "canvas", "drawing");
    await setDoc(drawingRef, {
      paths: newPaths,
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleWordSelect = async (word) => {
    setSelectedWord(word);
    const partyRef = doc(FIRESTORE_DB, "parties", partycode);
    await updateDoc(partyRef, { currentWord: word });
  };

  const handleUndo = () => {
    const updated = paths.slice(0, -1);
    updateDrawing(updated);
  };

  const handleClear = () => {
    updateDrawing([]);
  };

  const isDrawingTurn = userId === currentDrawer && timer > 0;

  if (!partycode) return <p>Invalid or missing party code.</p>;
  if (!userId) return <p>Authenticating...</p>;

  return (
    <div style={{ textAlign: "center" }}>
      {renderScoreboard()}
      <h2>🎮 Game in Progress</h2>
      <p>{isDrawingTurn ? "You're drawing!" : "Waiting for the artist..."}</p>

      {isDrawingTurn && !selectedWord && Array.isArray(wordChoices) && (
        <div>
          <h3>Pick a word to draw:</h3>
          {wordChoices.map((word) => (
            <button
              key={word}
              onClick={() => handleWordSelect(word)}
              style={{ margin: "4px", padding: "6px 12px", cursor: "pointer" }}
            >
              {word}
            </button>
          ))}
        </div>
      )}

      {selectedWord && isDrawingTurn && (
        <p>⏳ Time left: <strong>{timer}s</strong></p>
      )}

      {isDrawingTurn && selectedWord && (
        <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px" }}>
          {COLORS.map((color) => (
            <div
              key={color}
              onClick={() => {
                setCurrentColor(color);
                setIsEraser(false);
              }}
              style={{
                width: 24,
                height: 24,
                backgroundColor: color,
                border: currentColor === color && !isEraser ? "2px solid black" : "1px solid gray",
                cursor: "pointer",
              }}
            />
          ))}
          <button onClick={() => setIsEraser(true)} style={{ marginLeft: 8 }}>🧽 Eraser</button>
          <select value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))}>
            <option value={2}>Thin</option>
            <option value={4}>Normal</option>
            <option value={8}>Thick</option>
          </select>
          <button onClick={handleUndo}>↩️ Undo</button>
          <button onClick={handleClear}>
            <img src={trashIcon} alt="Clear" style={{ width: 20, height: 20 }} />
          </button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: "24px", alignItems: "flex-start", marginTop: 16 }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          style={{
            border: "2px solid black",
            backgroundColor: "white",
            cursor: isDrawingTurn && selectedWord ? "crosshair" : "not-allowed",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        <div
          style={{
            width: "300px",
            height: "500px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          
          <ChatBox
            gameId={partycode}
            userId={userId}
            currentWord={partyData?.currentWord || ""}
            currentDrawer={partyData?.currentDrawer}
            timer={timer}
          />

        </div>
      </div>
    </div>
  );
};

export default PlayGame;
