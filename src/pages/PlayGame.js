import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../firebase/firebase";
import trashIcon from "../assets/trash.png"; // make sure this path is correct
import ChatBox from "../components/chat";
import {getRandomWords} from "../components/wordUtil";

const COLORS = [
  "#000000", "#808080", "#FF0000", "#FFA500", "#FFFF00", "#00FF00",
  "#00FFFF", "#0000FF", "#800080", "#FFC0CB", "#A0522D", "#FFFFFF"
];

const PlayGame = () => {
  const { partycode } = useParams();
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const [paths, setPaths] = useState([]);
  const [userId, setUserId] = useState(null);
  const [isHost, setIsHost] = useState(false);

  const [currentColor, setCurrentColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    const unregisterAuthObserver = FIREBASE_AUTH.onAuthStateChanged((user) => {
      if (user) setUserId(user.uid);
    });
    return () => unregisterAuthObserver();
  }, []);

  useEffect(() => {
    if (!partycode || !userId) return;

    const partyRef = doc(FIRESTORE_DB, "parties", partycode);
    const drawingRef = doc(FIRESTORE_DB, "parties", partycode, "canvas", "drawing");

    const unsubscribeParty = onSnapshot(partyRef, (snap) => {
      const data = snap.data();
      setIsHost(data?.hostId === userId);
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

  const drawPaths = (paths) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    paths.forEach((segment) => {
      if (!segment || !Array.isArray(segment.points) || segment.points.length < 2) return;
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
    if (!isHost) return;
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
    if (!isHost || !isDrawing.current) return;
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

  const handleUndo = () => {
    const updated = paths.slice(0, -1);
    updateDrawing(updated);
  };

  const handleClear = () => {
    updateDrawing([]);
  };

  if (!partycode) return <p>Invalid or missing party code.</p>;
  if (!userId) return <p>Authenticating...</p>;

  return (
    <div style={{ textAlign: "center" }}>
      <h2>🎨 Game in Progress - {isHost ? "You are the Host (Draw)" : "Viewer"}</h2>

      {isHost && (
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

          <button onClick={() => setIsEraser(true)} style={{ marginLeft: 8 }}>
            🧽 Eraser
          </button>

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

    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "24px",
        alignItems: "flex-start",
        marginTop: 16,
      }}
    >
      {/* 🎨 Canvas container */}
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        style={{
          border: "2px solid black",
          backgroundColor: "white",
          cursor: isHost ? "crosshair" : "not-allowed",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* 💬 Chat container */}
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
          user={FIREBASE_AUTH.currentUser?.displayName || "Anonymous"}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px",
          }}
        />
      </div>
    </div>


    </div>

  );
};

export default PlayGame;
