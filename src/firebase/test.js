// src/services/partyService.js
import {
  doc,
  setDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { FIREBASE_AUTH, FIRESTORE_DB } from './firebase';

/**
 * Utility: make a 6-character alphanumeric party code (e.g. “A1B2C3”)
 */
const makePartyCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

/**
 * Creates a party document and returns the generated partyCode.
 * @param {string} mode  - game mode, e.g. 'classic' | 'impostor'
 */
export const createParty = async (mode = 'classic') => {
  const user = FIREBASE_AUTH.currentUser;
  if (!user) throw new Error('User must be signed in to create a party');

  // generate a unique code; retry if collision (rare)
  let partyCode = makePartyCode();
  await runTransaction(FIRESTORE_DB, async (transaction) => {
    const partyRef = doc(FIRESTORE_DB, 'parties', partyCode);
    const partySnap = await transaction.get(partyRef);
    if (partySnap.exists()) {
      // collision – pick a new code and throw to retry outside tx
      throw new Error('collision');
    }
    transaction.set(partyRef, {
      hostId: user.uid,
      createdAt: serverTimestamp(),
      status: 'waiting',          // waiting | drawing | voting | finished
      mode,
      members: {
        [user.uid]: {
          displayName: user.displayName ?? 'Anonymous',
          joinedAt: serverTimestamp(),
          isHost: true
        }
      }
    });
  }).catch(async (err) => {
    if (err.message === 'collision') {
      // rare – try again recursively
      partyCode = await createParty(mode);
    } else {
      throw err;
    }
  });

  return partyCode; // e.g. “4F7XQ9”
};
