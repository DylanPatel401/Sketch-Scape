// src/services/partyService.js
import {
  doc,
  setDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { FIREBASE_AUTH, FIRESTORE_DB } from './firebase';
import { updateProfile } from 'firebase/auth';

/**
 * Utility: make a 6-character alphanumeric party code (e.g. “A1B2C3”)
 */
const makePartyCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();


export const createParty = async (mode = 'classic') => {
  const user = FIREBASE_AUTH?.currentUser;
  if (!user) throw new Error('User must be signed in to create a party');

  const displayName = (
    localStorage.getItem('displayName') ||
    user.displayName ||
    'Anonymous'
  ).trim();

  const tryCreate = async () => {
    const partyCode = makePartyCode();
    const partyRef = doc(FIRESTORE_DB, 'parties', partyCode);

    try {
      await runTransaction(FIRESTORE_DB, async (transaction) => {
        const partySnap = await transaction.get(partyRef);
        if (partySnap.exists()) {
          throw new Error('collision');
        }

        transaction.set(partyRef, {
          hostId: user.uid,
          createdAt: serverTimestamp(),
          status: 'waiting',
          mode,
          members: {
            [user.uid]: {
              displayName,
              joinedAt: serverTimestamp(),
              isHost: true,
            },
          },
        });
      });

      return partyCode;
    } catch (err) {
      if (err.message === 'collision') {
        return tryCreate();
      } else {
        throw err;
      }
    }
  };

  return tryCreate();
};



export const updateUserDisplayName = async (userId, name) => {
  const user = FIREBASE_AUTH.currentUser;

  if (!user || user.uid !== userId) {
    console.error('No authenticated user or mismatched user ID.');
    return;
  }

  try {
    await updateProfile(user, { displayName: name });

    const userRef = doc(FIRESTORE_DB, 'users', userId);
    await setDoc(userRef, { displayName: name }, { merge: true });

    console.log('Display name updated successfully');
  } catch (err) {
    console.error('Failed to update display name:', err);
  }
};
