import { useState } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FIRESTORE_DB, FIREBASE_AUTH } from "../firebase/firebase";
import BackButton from "../components/BackButton";

import tree3 from "../assets/tree3.png";
import "../css/JoinParty.css";

const JoinParty = () => {
  const [partyCode, setPartyCode] = useState("");
  const navigate = useNavigate();

  const handleJoin = async () => {
    const trimmedCode = partyCode.trim().toUpperCase();

    if (!trimmedCode) {
      alert("Enter a party code");
      return;
    }

    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      alert("User not authenticated");
      return;
    }

    try {
      const partyRef = doc(FIRESTORE_DB, "parties", trimmedCode);
      const partySnap = await getDoc(partyRef);

      if (!partySnap.exists()) {
        alert("Party not found");
        return;
      }

      const memberData = {
        displayName: user.displayName ?? "Anonymous",
        joinedAt: serverTimestamp(),
        isHost: false,
      };

      await updateDoc(partyRef, {
        [`members.${user.uid}`]: memberData,
      });

      navigate(`/lobby/${trimmedCode}`);
    } catch (error) {
      console.error("Error joining party:", error);
      alert("Failed to join the party. Please try again.");
    }
  };

  return (
    <div className="join-container">
      <img src={tree3} alt="Palm Tree" className="tree-decoration" />
      <div className="join-card">
        
         <BackButton />
        
        <h2 className="join-title">🌴 Join an Island Party</h2>
        {/* 输入框 + Join Party 拆成两行 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
        

        <input
          type="text"
          value={partyCode}
          onChange={(e) => setPartyCode(e.target.value)}
          placeholder="Enter party code"
          className="join-input"
        />
        <button onClick={handleJoin} className="join-button">
          Join Party
        </button>
      </div>
    </div>
  </div>
  );
};

export default JoinParty;
