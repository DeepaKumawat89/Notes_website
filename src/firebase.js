import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
    apiKey: "AIzaSyA5nUm8KrMsFDX2oEvRaDs68F4fnRGYa4U",
    authDomain: "webnotes-cf5ed.firebaseapp.com",
    projectId: "webnotes-cf5ed",
    storageBucket: "webnotes-cf5ed.firebasestorage.app",
    messagingSenderId: "950571971434",
    appId: "1:950571971434:web:3032c944856cbaaf65eb13"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
