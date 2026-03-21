/**
 * Configuración Firebase para scripts TS locales (no exponer claves en el repo).
 * Requiere .env.local en la raíz del proyecto (mismas variables que Vite).
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const REQUIRED = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

export function getFirebaseConfigForScripts(): {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
} {
  const missing = REQUIRED.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
  if (missing.length > 0) {
    throw new Error(
      `[firebaseEnvForScripts] Faltan en .env.local: ${missing.join(', ')}. Ver .env.template.`
    );
  }
  const config = {
    apiKey: process.env.VITE_FIREBASE_API_KEY as string,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID as string,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: process.env.VITE_FIREBASE_APP_ID as string,
  };
  if (process.env.VITE_GA_MEASUREMENT_ID) {
    return { ...config, measurementId: process.env.VITE_GA_MEASUREMENT_ID };
  }
  return config;
}
