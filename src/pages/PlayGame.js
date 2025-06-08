import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../firebase/firebase";

const COLORS = ["black", "red", "green", "blue", "purple"];
const ERASER_COLOR = "white";

const PlayGame = () => {
  const { partycode } = useParams();
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const [paths, setPaths] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [userId, setUserId] = useState(null);
  const [currentColor, setCurrentColor] = useState("black");

  // Firebase Auth
  useEffect(() => {
    const unregisterAuthObserver = FIREBASE_AUTH.onAuthStateChanged((user) => {
      if (user) setUserId(user.uid);
    });
    return () => unregisterAuthObserver();
  }, []);

  // Firestore listeners
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

      ctx.strokeStyle = segment.color || "black";
      ctx.lineWidth = segment.color === ERASER_COLOR ? 16 : 2;
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


  const handleMouseDown = (e) => {
    if (!isHost) return;
    isDrawing.current = true;
    const newPoint = getCoords(e);
    const newPath = { color: currentColor, points: [newPoint] };
    updateDrawing([...paths, newPath]);
  };

  const handleMouseMove = (e) => {
    if (!isHost || !isDrawing.current) return;
    const newPoint = getCoords(e);
    const updatedPaths = [...paths];
    const currentPath = updatedPaths[updatedPaths.length - 1];
    currentPath.points.push(newPoint);
    updateDrawing(updatedPaths);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const updateDrawing = async (newPaths) => {
    setPaths(newPaths);
    const drawingRef = doc(FIRESTORE_DB, "parties", partycode, "canvas", "drawing");
    await setDoc(drawingRef, {
      paths: newPaths,
      lastUpdated: new Date().toISOString(),
    });
  };

  if (!partycode) return <p>Invalid or missing party code.</p>;
  if (!userId) return <p>Authenticating...</p>;

  return (
    <div style={{ textAlign: "center" }}>
      <h2>🎨 Game in Progress - {isHost ? "You are the Host (Draw)" : "Viewer"}</h2>

      {isHost && (
        <div style={{ marginBottom: 10 }}>
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setCurrentColor(color)}
              style={{
                backgroundColor: color,
                color: color === "black" ? "white" : "black",
                marginRight: 8,
                padding: "6px 12px",
                border: currentColor === color ? "2px solid gray" : "1px solid lightgray",
                borderRadius: "4px",
              }}
            >
              {color}
            </button>
          ))}
          <button
            onClick={() => setCurrentColor(ERASER_COLOR)}
            style={{
              backgroundColor: "lightgray",
              marginLeft: 10,
              padding: "6px 12px",
              border: currentColor === ERASER_COLOR ? "2px solid gray" : "1px solid gray",
              borderRadius: "4px",
            }}
          >
            Eraser
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        style={{
          border: "2px solid black",
          background: "white",
          cursor: isHost ? "crosshair" : "not-allowed",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};

export default PlayGame;
