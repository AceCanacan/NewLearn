// src/firebase/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzabBx3_p7bbb7NxRfxlQ3X5n_Ou3mVAo",
  authDomain: "nulearn-c9eea.firebaseapp.com",
  projectId: "nulearn-c9eea",
  storageBucket: "nulearn-c9eea.appspot.com",
  messagingSenderId: "69488928837",
  appId: "1:69488928837:web:52b6ecc4d2cc7581c0db2c",
  measurementId: "G-DPKT2X512T"
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

// Generalized Save Function
const saveToFirestore = async (docPath, value, options = { merge: false }) => {
  try {
    const pathSegments = docPath.split('/');
    const docRef = doc(db, ...pathSegments);
    await setDoc(docRef, value, options);
  } catch (error) {
    // Handle error as needed
    throw error;
  }
};

// Generalized Load Function
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
    // Handle error as needed
    throw error;
  }
};

// Generalized Remove Function
const removeFromFirestore = async (docPath) => {
  try {
    const pathSegments = docPath.split('/');
    const docRef = doc(db, ...pathSegments);
    await deleteDoc(docRef);
  } catch (error) {
    // Handle error as needed
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
        data[deckName].splice(index, 1); // Remove the score entry at the specified index
        await updateDoc(docRef, { [deckName]: data[deckName] });
      }
    }
  } catch (error) {
    // Handle error as needed
    throw error;
  }
};

// Export everything
export { db, auth, storage, logFirebaseConfig, saveToFirestore, loadFromFirestore, removeFromFirestore, deleteScoreFromFirestore };