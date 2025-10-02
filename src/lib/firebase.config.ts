// ========================================
// CONFIGURACIÓN FIREBASE - PROYECTO ÚNICO
// ========================================

// Configuración del proyecto de Firebase
export const firebaseConfig = {
  apiKey: "AIzaSyAjIAWWlfWOay9AKeAXhW8mcROvOCqZxGw",
  authDomain: "g-license-mgr-dev-gsv000-015.firebaseapp.com",
  projectId: "g-license-mgr-dev-gsv000-015",
  storageBucket: "g-license-mgr-dev-gsv000-015.firebasestorage.app",
  messagingSenderId: "1013067759367",
  appId: "1:1013067759367:web:7f2f61508f1db32b748fa2"
};

// Función para obtener la configuración (mantiene compatibilidad)
export const getFirebaseConfig = () => {
  console.log('🚀 Firebase Project: g-license-mgr-dev-gsv000-015');
  return firebaseConfig;
};
