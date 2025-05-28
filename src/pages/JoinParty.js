import { useState } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FIRESTORE_DB, FIREBASE_AUTH } from "../firebase/firebase";

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

    const partyData = partySnap.data();

    const memberData = {
      displayName: "Anonymous", // or let them enter a name
      joinedAt: serverTimestamp(),
      isHost: false,
    };

    await updateDoc(partyRef, {
      [`members.${user.uid}`]: memberData,
    });

    navigate(`/lobby/${partyCode.trim()}`);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Join a Party</h2>
      <input
        type="text"
        value={partyCode}
        onChange={(e) => setPartyCode(e.target.value)}
        placeholder="Enter party code"
        className="border p-2 mr-2"
      />
      <button onClick={handleJoin} className="bg-blue-500 text-white px-4 py-2">
        Join
      </button>
    </div>
  );
};

export default JoinParty;
