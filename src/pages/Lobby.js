import { useParams } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FIRESTORE_DB } from "../firebase/firebase";

import "../css/Lobby.css";
import tree1 from "../assets/tree3.png";
import tree2 from "../assets/tree3.png";

import { useNavigate } from "react-router-dom";

const Lobby = () => {
  const navigate = useNavigate();

  const { partyCode } = useParams();
  const [partyData, setPartyData] = useState(null);
  const [selectedMode, setSelectedMode] = useState("classic");

  const handleStartGame = async () => {
    try {
      console.log("Starting the game...");

      // Example: update game status in Firestore
      const partyRef = doc(FIRESTORE_DB, "parties", partyCode);
      await updateDoc(partyRef, {
        status: "started", // you can change this field to trigger game logic
      });

      // Optionally navigate to the game screen
      navigate(`/play/${partyCode}`);

    } catch (err) {
      console.error("Failed to start the game:", err);
    }
  };


  useEffect(() => {
    const partyRef = doc(FIRESTORE_DB, "parties", partyCode);
    const unsubscribe = onSnapshot(partyRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPartyData(data);
        setSelectedMode(data.mode || "classic");
      } else {
        console.error("Party not found");
      }
    });

    return () => unsubscribe();
  }, [partyCode]);

  if (!partyData) return <p className="loading-text">Loading lobby...</p>;

  const isHost = partyData.hostId === localStorage.getItem("userId");

  const handleModeChange = async (e) => {
    const newMode = e.target.value;
    setSelectedMode(newMode);

    const partyRef = doc(FIRESTORE_DB, "parties", partyCode);
    await updateDoc(partyRef, { mode: newMode });
  };

  return (
    <div className="lobby-container">
      <img src={tree1} alt="Tree Left" className="tree tree-left" />
      
      <div className="lobby-card">
        <h2 className="lobby-title">🏝️ Island Lobby</h2>
        <p className="lobby-code">
          Party Code: <span>{partyCode}</span>
        </p>

        <p className="lobby-mode">
          Game Mode:{" "}
          {isHost ? (
            <select value={selectedMode} onChange={handleModeChange} className="mode-dropdown">
              <option value="classic">Classic</option>
              <option value="test">Test</option>
            </select>
          ) : (
            <span>{partyData.mode}</span>
          )}
        </p>

        <p className="lobby-status">
          Status: <span>{partyData.status}</span>
        </p>

        <h3 className="lobby-players-header">Players</h3>
        <ul className="players-list">
          {Object.entries(partyData.members).map(([uid, member]) => (
            <li key={uid} className={`player-item ${member.isHost ? "host" : ""}`}>
              <p className="player-name">{member.displayName}</p>
              {member.isHost && <p className="player-role">Host</p>}
            </li>
          ))}
        </ul>

        <div className="lobby-buttons">
          {isHost && (
            <button className="btn start-btn" onClick={handleStartGame}>
              Start Game
            </button>
          )}

        </div>
      </div>

      <img src={tree2} alt="Tree Right" className="tree tree-right" />
    </div>
  );
};

export default Lobby;
