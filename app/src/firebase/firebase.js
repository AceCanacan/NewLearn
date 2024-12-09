// src/firebase/Firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

const logFirebaseConfig = () => {
  console.log('Firebase Config:', firebaseConfig);
};

// Authentication Functions
const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

// Generalized Firestore Functions
const saveToFirestore = async (docPath, value, options = { merge: false }) => {
  try {
    const pathSegments = docPath.split('/');
    const docRef = doc(db, ...pathSegments);
    await setDoc(docRef, value, options);
  } catch (error) {
    throw error;
  }
};

const loadFromFirestore = async (path, defaultValue = null, isCollection = false) => {
  try {
    if (isCollection) {
      const pathSegments = path.split('/');
      const collectionRef = collection(db, ...pathSegments);
      const querySnapshot = await getDocs(collectionRef);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return data.length ? data : defaultValue;
    } else {
      const pathSegments = path.split('/');
      const docRef = doc(db, ...pathSegments);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : defaultValue;
    }
  } catch (error) {
    throw error;
  }
};

const removeFromFirestore = async (docPath) => {
  try {
    const pathSegments = docPath.split('/');
    const docRef = doc(db, ...pathSegments);
    await deleteDoc(docRef);
  } catch (error) {
    throw error;
  }
};

// Specialized Function to Delete a Score from Firestore
const deleteScoreFromFirestore = async (userId, deckName, index) => {
  try {
    const docPath = `users/${userId}/settings/scores`;
    const docRef = doc(db, ...docPath.split('/'));
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data[deckName] && Array.isArray(data[deckName])) {
        data[deckName].splice(index, 1);
        await updateDoc(docRef, { [deckName]: data[deckName] });
      }
    }
  } catch (error) {
    throw error;
  }
};

// Export everything
export { db, auth, storage, logFirebaseConfig, signUp, signIn, signOutUser, onAuthChange, saveToFirestore, loadFromFirestore, removeFromFirestore, deleteScoreFromFirestore, sendPasswordResetEmail };