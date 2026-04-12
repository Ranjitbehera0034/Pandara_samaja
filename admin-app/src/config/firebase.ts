import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Shared Firebase configuration (same project as portal-app)
const firebaseConfig = {
    apiKey: "AIzaSyCwskVIeBBZ3c747wxQFKjBA_EDMBvNChE",
    authDomain: "nikhila-odisha-pandara-samaja.firebaseapp.com",
    projectId: "nikhila-odisha-pandara-samaja",
    storageBucket: "nikhila-odisha-pandara-samaja.firebasestorage.app",
    messagingSenderId: "956457904180",
    appId: "1:956457904180:web:df750b9b093bb20d4f4261",
    measurementId: "G-1QHC9CBP0E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export default app;
