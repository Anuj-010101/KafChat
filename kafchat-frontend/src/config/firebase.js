import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Aapka copy kiya hua config yahan paste karein:
const firebaseConfig = {
  apiKey: "AIzaSyBsqMv8gsFIQHL-LFhVVE9eCDHZpnxBuQA",
  authDomain: "kafchat-4b3d2.firebaseapp.com",
  projectId: "kafchat-4b3d2",
  storageBucket: "kafchat-4b3d2.firebasestorage.app",
  messagingSenderId: "481441854930",
  appId: "1:481441854930:web:2b38ec85b4b8332c53840b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);