import React, { useEffect, useRef, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { FIRESTORE_DB } from "../firebase/firebase";

const ChatBox = ({ gameId, userId, currentWord, currentDrawer, timer }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [displayName, setDisplayName] = useState("Anonymous");
  const messagesEndRef = useRef(null);
  const [lastCorrectWord, setLastCorrectWord] = useState(null);

  // Fetch user displayName from Firestore party data
  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!userId || !gameId) return;
      const partyRef = doc(FIRESTORE_DB, "parties", gameId);
      const partySnap = await getDoc(partyRef);
      if (partySnap.exists()) {
        const data = partySnap.data();
        const name = data.members?.[userId]?.displayName;
        if (name) setDisplayName(name);
      }
    };
    fetchDisplayName();
  }, [gameId, userId]);

  // Realtime message listener
  useEffect(() => {
    const messagesRef = collection(FIRESTORE_DB, "parties", gameId, "messages");
    const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => doc.data());
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [gameId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed) return;

    const guess = trimmed.toLowerCase();
    const word = currentWord?.toLowerCase();
    const isCorrect = word && guess === word;

    const partyRef = doc(FIRESTORE_DB, "parties", gameId);
    const partySnap = await getDoc(partyRef);

    if (isCorrect && userId !== currentDrawer && partySnap.exists()) {
      const data = partySnap.data();
      const guessedPlayers = data.guessedPlayers || {};
      const scores = data.scores || {};

      if (!guessedPlayers[userId]) {
        guessedPlayers[userId] = true;
        scores[userId] = (scores[userId] || 0) + timer * 10;

        await updateDoc(partyRef, {
          guessedPlayers,
          scores,
          currentWord: null,
        });

        setLastCorrectWord(currentWord?.toLowerCase());
      }

      setNewMessage("");
      return;
    }

    // 💡 Prevent sending the last correct word again
    if (guess === lastCorrectWord) {
      setNewMessage("");
      return;
    }

    // Send regular message
    await addDoc(collection(FIRESTORE_DB, "parties", gameId, "messages"), {
      text: trimmed,
      user: displayName || "Anonymous",
      timestamp: serverTimestamp(),
    });

    setNewMessage("");
  };



  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: "4px" }}>
            <strong>{msg.user || "Anonymous"}:</strong> {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} style={{ display: "flex", padding: "8px", borderTop: "1px solid #ccc" }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Enter your message..."
          style={{
            flex: 1,
            padding: "8px",
            fontSize: "14px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        <button
          type="submit"
          style={{
            marginLeft: "8px",
            padding: "8px 12px",
            fontSize: "14px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
