import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc, deleteField } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FIRESTORE_DB } from "../firebase/firebase";

import "../css/Lobby.css";
import tree1 from "../assets/tree3.png";
import tree2 from "../assets/tree3.png";

const Lobby = () => {
  const { partyCode } = useParams();
  const navigate = useNavigate();

  const [partyData, setPartyData] = useState(null);
  const [selectedMode, setSelectedMode] = useState("classic");

  const handleStartGame = async () => {
    try {
      console.log("Starting the game...");
      const partyRef = doc(FIRESTORE_DB, "parties", partyCode);
      await updateDoc(partyRef, { status: "started" });
      navigate(`/play/${partyCode}`);
    } catch (err) {
      console.error("Failed to start the game:", err);
    }
  };

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

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const partyRef = doc(FIRESTORE_DB, "parties", partyCode);

    // Listen for party data updates
    const unsubscribe = onSnapshot(partyRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPartyData(data);
        setSelectedMode(data.mode || "classic");
      } else {
        console.error("Party not found");
      }
    });

    // Remove player from members when tab/window closes
    const handleUnload = async () => {
      try {
        await updateDoc(partyRef, {
          [`members.${userId}`]: deleteField(),
        });
        console.log("Player removed from lobby on unload.");
      } catch (err) {
        console.error("Failed to remove player:", err);
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      unsubscribe();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [partyCode]);

  if (!partyData || typeof partyData !== "object") {
    return <p className="loading-text">Loading lobby...</p>;
  }

  const isHost = partyData.hostId === localStorage.getItem("userId");

  return (
    <div className="lobby-container">
      <img src={tree1} alt="Tree Left" className="tree tree-left" />

      <div className="lobby-card">
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
              <option value="test">Test</option>
            </select>
          ) : (
            <span className="lobby-mode-value">
              {typeof partyData.mode === "string"
                ? partyData.mode
                : partyData.mode?.mode || "unknown"}
            </span>
          )}
        </p>

        <p className="lobby-status">
          Status: <span>{partyData.status || "waiting"}</span>
        </p>

        <h3 className="lobby-players-header">Players</h3>
        <ul className="players-list">
          {partyData?.members &&
            Object.entries(partyData.members).map(([uid, member]) => {
              const displayName = String(member.displayName || "Unknown");
              return (
                <li
                  key={uid}
                  className={`player-item ${member.isHost ? "host" : ""}`}
                >
                  <p className="player-name">{displayName}</p>
                  {member.isHost && <p className="player-role">Host</p>}
                </li>
              );
            })}
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
