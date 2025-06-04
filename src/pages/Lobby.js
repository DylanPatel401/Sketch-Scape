// src/pages/Lobby.js
import { useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FIRESTORE_DB } from "../firebase/firebase";
import "../css/Lobby.css";

const Lobby = () => {
  const { partyCode } = useParams();
  const [partyData, setPartyData] = useState(null);

  useEffect(() => {
    const partyRef = doc(FIRESTORE_DB, "parties", partyCode);
    const unsubscribe = onSnapshot(partyRef, (docSnap) => {
      if (docSnap.exists()) {
        setPartyData(docSnap.data());
      } else {
        console.error("Party not found");
      }
    });

    return () => unsubscribe();
  }, [partyCode]);

  if (!partyData) return <p>Loading lobby...</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold">Lobby: {partyCode}</h2>
      <p>Status: {partyData.status}</p>
      <p>Mode: {partyData.mode}</p>

      <h3 className="mt-4 text-xl font-semibold">Players</h3>
      <ul>
        {Object.entries(partyData.members).map(([uid, member]) => (
          <li key={uid}>
            {member.displayName} {member.isHost ? "(Host)" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Lobby;
