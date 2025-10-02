// ========================================
// CONFIGURACIÓN FIREBASE - PROYECTO ÚNICO
// ========================================

// Configuración del proyecto de Firebase
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA5q4HOusvXW8wObkuyrB8it1y7Tyq1op0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "licencias-gestor.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "licencias-gestor",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "licencias-gestor.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "592435804089",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:592435804089:web:b2e6f3d3db466f18372868"
};

// Función para obtener la configuración (mantiene compatibilidad)
export const getFirebaseConfig = () => {
  console.log('🚀 Firebase Project: licencias-gestor');
  return firebaseConfig;
};
