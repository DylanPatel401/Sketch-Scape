import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  onSnapshot,
  updateDoc,
  deleteField,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { FIRESTORE_DB, FIREBASE_AUTH } from "../firebase/firebase";

import "../css/Lobby.css";
import tree1 from "../assets/tree3.png";
import tree2 from "../assets/tree3.png";

const Lobby = () => {
  const { partyCode } = useParams();
  const navigate = useNavigate();

  const [partyData, setPartyData] = useState(null);
  const [selectedMode, setSelectedMode] = useState("classic");
  const [userId, setUserId] = useState(localStorage.getItem("userId"));
  const [numRounds, setNumRounds] = useState(3); // default 3 rounds

  // Sync userId with Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      if (user) {
        localStorage.setItem("userId", user.uid);
        setUserId(user.uid);
      } else {
        localStorage.removeItem("userId");
        setUserId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Host starts the game
  const handleStartGame = async () => {
    try {
      const partyRef = doc(FIRESTORE_DB, "parties", partyCode);
      const partySnap = await getDoc(partyRef);
      const data = partySnap.data();

      const members = data.members || {};
      const memberIds = Object.keys(members);
      const firstDrawer = memberIds[0];

      const initHasDrawnMap = {};
      memberIds.forEach((uid) => {
        initHasDrawnMap[uid] = false;
      });

      await updateDoc(partyRef, {
        status: "started",
        currentDrawer: firstDrawer,
        currentWord: null,
        guessedPlayers: {},
        hasDrawnMap: initHasDrawnMap,
        roundCount: 1,
      });
    } catch (err) {
      console.error("Failed to start the game:", err);
    }
  };

  // Host selects game mode
  const handleModeChange = async (e) => {
    const newMode = e.target.value;
    setSelectedMode(newMode);

    try {
      const partyRef = doc(FIRESTORE_DB, "parties", partyCode);
      await updateDoc(partyRef, { mode: newMode });
    } catch (err) {
      console.error("Failed to update mode:", err);
    }
  };

  // Host selects number of rounds
  const handleRoundsChange = async (e) => {
    const value = parseInt(e.target.value);
    setNumRounds(value);

    try {
      const partyRef = doc(FIRESTORE_DB, "parties", partyCode);
      await updateDoc(partyRef, { maxRounds: value });
    } catch (err) {
      console.error("Failed to update rounds:", err);
    }
  };

  // Lobby real-time sync + cleanup
  useEffect(() => {
    if (!userId) return;

    const partyRef = doc(FIRESTORE_DB, "parties", partyCode);

    const unsubscribe = onSnapshot(partyRef, (docSnap) => {
      if (!docSnap.exists()) {
        console.error("Party not found");
        return;
      }

      const data = docSnap.data();
      setPartyData(data);

      // Sync local state safely
      setSelectedMode(typeof data.mode === "string" ? data.mode : data.mode?.mode || "classic");

      if (typeof data.maxRounds === "number") {
        setNumRounds(data.maxRounds);
      }

      if (data.status === "started") {
        navigate(`/play/${partyCode}`);
      }
    });

    const handleUnload = async () => {
      try {
        await updateDoc(partyRef, {
          [`members.${userId}`]: deleteField(),
        });
      } catch (err) {
        console.error("Failed to remove player:", err);
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => {
      unsubscribe();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [partyCode, navigate, userId]);

  if (!partyData || typeof partyData !== "object") {
    return <p className="loading-text">Loading lobby...</p>;
  }

  const isHost = partyData.hostId === userId;

  return (
    <div className="lobby-container">
      <img src={tree1} alt="Tree Left" className="tree tree-left" />

      <div className="lobby-card">
        {/* Back button */}
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "10px" }}>
          <button
          onClick={() => navigate(-1)}
          style={{
            padding: "6px 12px",
            border: "2px solid #ccc",
            borderRadius: "5px",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontWeight: "bold"
            }}
          >
            ← Back
            </button>
          </div>
        <h2 className="lobby-title">🏝️ Lobby</h2>
        <p className="lobby-code">
          Party Code: <span>{partyCode}</span>
        </p>

        <p className="lobby-mode">
          Game Mode:{" "}
          {isHost ? (
            <select
              value={selectedMode}
              onChange={handleModeChange}
              className="mode-dropdown"
            >
              <option value="classic">Classic</option>
            </select>
          ) : (
            <span className="lobby-mode-value">{selectedMode}</span>
          )}
        </p>

        <p className="lobby-rounds">
          Rounds:{" "}
          {isHost ? (
            <select
              value={numRounds}
              onChange={handleRoundsChange}
              className="rounds-dropdown"
            >
              {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          ) : (
            <span>{numRounds}</span>
          )}
        </p>

        <p className="lobby-status">
          Status: <span>{partyData.status || "waiting"}</span>
        </p>

        <h3 className="lobby-players-header">Players</h3>
        <ul className="players-list">
          {partyData.members &&
            Object.entries(partyData.members).map(([uid, member]) => (
              <li
                key={uid}
                className={`player-item ${member.isHost ? "host" : ""}`}
              >
                <p className="player-name">
                  {member.displayName || "Unknown"}
                </p>
                {member.isHost && <p className="player-role">Host</p>}
              </li>
            ))}
        </ul>

        {isHost && (
          <div className="lobby-buttons">
            <button className="btn start-btn" onClick={handleStartGame}>
              Start Game
            </button>
          </div>
        )}
      </div>

      <img src={tree2} alt="Tree Right" className="tree tree-right" />
    </div>
  );
};

export default Lobby;
