// src/firebase/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

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

export { db, auth, storage, logFirebaseConfig };