/**
 * Carga la configuración de Firebase desde variables de entorno (.env.local o .env).
 * No incluir claves en el código: usa .env.local (no versionado).
 */
const path = require('path');

function loadEnv() {
  const dotenv = require('dotenv');
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

const REQUIRED = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

function getFirebaseConfig() {
  loadEnv();
  const missing = REQUIRED.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
  if (missing.length > 0) {
    throw new Error(
      `[firebase-env] Faltan variables en .env.local: ${missing.join(', ')}. Copia .env.template y completa los valores.`
    );
  }
  const config = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  };
  if (process.env.VITE_GA_MEASUREMENT_ID) {
    config.measurementId = process.env.VITE_GA_MEASUREMENT_ID;
  }
  return config;
}

module.exports = { getFirebaseConfig, loadEnv };
