import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  setDoc,
  updateDoc,
  doc, 
  query, 
  where, 
  orderBy, 
  getDoc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  User as FirebaseUser
} from "firebase/auth";

// Firebase Applet Config
const firebaseConfig = {
  apiKey: "AIzaSyClZBD1JuO1unvtQn-zSaRBujrniUMaEhM",
  authDomain: "newdeploy-502015.firebaseapp.com",
  projectId: "newdeploy-502015",
  storageBucket: "newdeploy-502015.firebasestorage.app",
  messagingSenderId: "366107713437",
  appId: "1:366107713437:web:93a04ef57c9a1a1060d974"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (using custom database ID if available)
export const db = getFirestore(app, "ai-studio-9f55d6a4-4943-4185-ac88-353752b39268");

// Initialize Auth
export const auth = getAuth(app);

export { 
  collection, 
  getDocs, 
  addDoc, 
  setDoc,
  updateDoc,
  doc, 
  query, 
  where, 
  orderBy, 
  getDoc,
  deleteDoc,
  onSnapshot,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInAnonymously
};
export type { FirebaseUser };
