import { useState } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FIRESTORE_DB, FIREBASE_AUTH } from "../firebase/firebase";

import tree3 from "../assets/tree3.png";
import "../css/JoinParty.css";

const JoinParty = () => {
  const [partyCode, setPartyCode] = useState("");
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!partyCode.trim()) return alert("Enter a party code");

    const user = FIREBASE_AUTH.currentUser;
    if (!user) return alert("User not authenticated");

    const partyRef = doc(FIRESTORE_DB, "parties", partyCode.trim());
    const partySnap = await getDoc(partyRef);

    if (!partySnap.exists()) {
      alert("Party not found");
      return;
    }

    const memberData = {
      displayName: "Anonymous",
      joinedAt: serverTimestamp(),
      isHost: false,
    };

    await updateDoc(partyRef, {
      [`members.${user.uid}`]: memberData,
    });

    navigate(`/lobby/${partyCode.trim()}`);
  };

  return (
    <div className="join-container">
      <img src={tree3} alt="Palm Tree" className="tree-decoration" />
      <div className="join-card">
        <h2 className="join-title">🌴 Join an Island Party</h2>
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
  );
};

export default JoinParty;
