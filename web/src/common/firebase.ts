import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: "AIzaSyD-samDCF2QochQLFjWQYSGLLPTg0tx3iw",
	authDomain: "goal-home.firebaseapp.com",
	projectId: "goal-home",
	storageBucket: "goal-home.appspot.com",
	messagingSenderId: "881812538925",
	appId: "1:881812538925:web:ddc57da9cb055bbca9daa4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

/**
 * File Management
 */
export const storage = getStorage(app);
