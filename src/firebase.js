import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ⚠️ PEGA AQUÍ TUS LLAVES DE FIREBASE REALES
const firebaseConfig = {
    apiKey: "AIzaSyCOWP_BAjqMBeSDzSL5q__OZEEDN1KblIY",
    authDomain: "ute-web.firebaseapp.com",
    projectId: "ute-web",
    storageBucket: "ute-web.firebasestorage.app",
    messagingSenderId: "528603541522",
    appId: "1:528603541522:web:ebc56b81384b14f6d368cb",
    measurementId: "G-WXF9XEB7ME"
};

// Inicializamos y exportamos para usar en otros archivos
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);