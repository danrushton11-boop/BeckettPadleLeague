import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCAWk_WwRrN9zm_Sg4sUOBSw7OSUJNs8FQ",
  authDomain: "beckett-padle.firebaseapp.com",
  projectId: "beckett-padle",
  storageBucket: "beckett-padle.firebasestorage.app",
  messagingSenderId: "276182196351",
  appId: "1:276182196351:web:b1621464d2b5fd8640df4a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
