import { initializeApp } from "firebase/app";
import { getAuth, GithubAuthProvider, GoogleAuthProvider } from "firebase/auth";
// Opcional: si quieres usar analytics
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDb33T7xuwcK0DOfRWs_EPUcTsVjRzh9lE",
  authDomain: "ejercicio4-94dd6.firebaseapp.com",
  projectId: "ejercicio4-94dd6",
  storageBucket: "ejercicio4-94dd6.firebasestorage.app",
  messagingSenderId: "613459833043",
  appId: "1:613459833043:web:082e06ea6f231e60d02426",
  measurementId: "G-8YBKXW79M2"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar las herramientas que usaremos en la app
export const autenticacion = getAuth(app);
export const proveedorGitHub = new GithubAuthProvider();
export const proveedorGoogle = new GoogleAuthProvider();
export const analytics = getAnalytics(app);

export default app;