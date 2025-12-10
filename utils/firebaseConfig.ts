import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// @ts-ignore
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
// import { getAnalytics } from "firebase/analytics"; // Analytics optional

const firebaseConfig = {
    apiKey: "AIzaSyDU68yyfZLnG7LiPZaGPfbBajI1HYEkCWA",
    authDomain: "music-game-304b9.firebaseapp.com",
    databaseURL: "https://music-game-304b9-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "music-game-304b9",
    storageBucket: "music-game-304b9.firebasestorage.app",
    messagingSenderId: "701599299100",
    appId: "1:701599299100:web:e9d08b1c2378be2c93d1d9",
    measurementId: "G-9NMHVWZEGL"
};

const app = initializeApp(firebaseConfig);

let auth: ReturnType<typeof getAuth>;
if (Platform.OS === 'web') {
    auth = getAuth(app);
} else {
    try {
        auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage)
        });
    } catch (e: any) {
        // Auth already initialized, just get the existing instance
        auth = getAuth(app);
    }
}

export { auth };
export const db = getDatabase(app);
