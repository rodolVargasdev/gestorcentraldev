// ========================================
// CONFIGURACIÓN FIREBASE - PROYECTO ÚNICO
// ========================================

// Configuración del proyecto de Firebase
export const firebaseConfig = {
  apiKey: "AIzaSyA5q4HOusvXW8wObkuyrB8it1y7Tyq1op0",
  authDomain: "licencias-gestor.firebaseapp.com",
  projectId: "licencias-gestor",
  storageBucket: "licencias-gestor.firebasestorage.app",
  messagingSenderId: "592435804089",
  appId: "1:592435804089:web:b2e6f3d3db466f18372868"
};

// Función para obtener la configuración (mantiene compatibilidad)
export const getFirebaseConfig = () => {
  console.log('🚀 Firebase Project: licencias-gestor');
  return firebaseConfig;
};
