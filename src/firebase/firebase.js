import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBlFDdJANbmtS1qekYsinHO6T7p0ZnsUJI",
  authDomain: "sketch-scape-b2be8.firebaseapp.com",
  projectId: "sketch-scape-b2be8",
  storageBucket: "sketch-scape-b2be8.appspot.com", // FIXED domain typo
  messagingSenderId: "149825651017",
  appId: "1:149825651017:web:cd5f26647fe0f7fff01a98",
  measurementId: "G-TVTTGCCHJH"
};

const FIREBASE_APP = initializeApp(firebaseConfig);

export const FIREBASE_AUTH = getAuth(FIREBASE_APP); // SIMPLIFIED FOR TESTING
export const FIRESTORE_DB = getFirestore(FIREBASE_APP);

onAuthStateChanged(FIREBASE_AUTH, (user) => {
  if (!user) {
    signInAnonymously(FIREBASE_AUTH).catch((error) => {
      console.error("Anonymous sign-in failed:", error);
    });
  }
});