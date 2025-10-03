// ========================================
// CONFIGURACIÓN FIREBASE - VARIABLES DE ENTORNO
// ========================================

// Configuración del proyecto de Firebase usando variables de entorno
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Función para obtener la configuración (mantiene compatibilidad)
export const getFirebaseConfig = () => {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  console.log(`🚀 Firebase Project: ${projectId}`);
  return firebaseConfig;
};

// Función para validar configuración
export const validateFirebaseConfig = () => {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN', 
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:', missingVars);
    throw new Error(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
  }

  console.log('✅ Configuración de Firebase válida');
  return true;
};
