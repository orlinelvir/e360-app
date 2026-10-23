import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// No hace falta llamar getReactNativePersistence/AsyncStorage a mano —
// versiones recientes del SDK de Firebase detectan el entorno React Native
// solas y persisten la sesión automáticamente en cuanto
// @react-native-async-storage/async-storage está instalado como dependencia
// (ya lo está, ver package.json). El patrón viejo de initializeAuth(app,
// {persistence: getReactNativePersistence(...)}) quedó obsoleto.

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Base del Hub web para las rutas /api/admin/* (Torre de Control) — esas
// pantallas reusan la lógica de servidor ya construida ahí en vez de
// reimplementarla con el SDK de cliente. OJO: tiene que ser el dominio
// exacto (con "www."), no el apex — el apex responde con un 308 a
// www.emprende360.biz, y al seguir una redirección entre dominios distintos
// fetch descarta el header de Authorization, provocando un 401 falso.
export const HUB_API_BASE_URL = process.env.EXPO_PUBLIC_HUB_API_BASE_URL || "https://www.emprende360.biz";
