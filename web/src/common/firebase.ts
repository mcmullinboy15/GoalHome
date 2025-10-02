import { initializeApp } from "firebase/app";
import {
	collection,
	doc,
	getDoc,
	getDocs,
	getFirestore,
	updateDoc,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import type { Settings } from "../utils/types";

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

// Get all documents from settings collection
export const getSettings = async () => {
	const settingsRef = collection(db, "settings");
	const settingsSnapshot = await getDocs(settingsRef);
	return Object.fromEntries(
		settingsSnapshot.docs.map((doc) => [doc.id, doc.data()?.value]),
	) as Settings;
};

// Get Document from settings collection
export const getSetting = async (setting: keyof Settings) => {
	const settingRef = doc(db, "settings", setting);
	const settingDoc = await getDoc(settingRef);
	return settingDoc.data()?.value;
};

// Update Document in settings collection
export const updateSetting = async (setting: string, value: string) => {
	const settingRef = doc(db, "settings", setting);
	await updateDoc(settingRef, { value });
};

// Update All Documents in settings collection
export const updateSettings = async (settings: Settings) => {
	const settingsRef = collection(db, "settings");
	const settingsSnapshot = await getDocs(settingsRef);
	settingsSnapshot.docs.forEach(async (doc) => {
		const setting = doc.id as keyof Settings;
		await updateSetting(setting, settings[setting]);
	});
};

/**
 * File Management
 */
export const storage = getStorage(app);

export const uploadFile = async (file: File, filename: string) => {
	const storageRef = ref(storage, filename);
	try {
		await uploadBytes(storageRef, file);
	} catch (error) {
		console.log(error);
		return null;
	}
};

export const downloadFile = async (filename: string): Promise<File | null> => {
	const storageRef = ref(storage, filename);
	try {
		return getDownloadURL(storageRef)
			.then((url) => fetch(url))
			.then((response) => response.blob())
			.then((blob) => {
				const metadata = {
					type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				};
				const file = new File([blob], filename, metadata);
				return file;
			});
	} catch (error) {
		console.log(error);
		return null;
	}
};
