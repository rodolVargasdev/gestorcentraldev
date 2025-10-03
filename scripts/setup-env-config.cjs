#!/usr/bin/env node

/**
 * Script para configurar variables de entorno de Firebase
 * Facilita la migración entre proyectos de Firebase
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log('🔧 CONFIGURACIÓN DE VARIABLES DE ENTORNO FIREBASE');
  console.log('==================================================\n');

  console.log('📋 Este script te ayudará a configurar las variables de entorno para tu proyecto Firebase.');
  console.log('💡 Puedes obtener estas credenciales desde: https://console.firebase.google.com/\n');

  try {
    // Solicitar credenciales de Firebase
    const apiKey = await question('🔑 API Key: ');
    const authDomain = await question('🌐 Auth Domain (proyecto.firebaseapp.com): ');
    const projectId = await question('📁 Project ID: ');
    const storageBucket = await question('🗄️ Storage Bucket (proyecto.appspot.com): ');
    const messagingSenderId = await question('📱 Messaging Sender ID: ');
    const appId = await question('📱 App ID: ');
    const measurementId = await question('📊 Measurement ID (opcional, presiona Enter para omitir): ');

    // Crear contenido del archivo .env.local
    const envContent = `# ========================================
# CONFIGURACIÓN FIREBASE - VARIABLES DE ENTORNO
# ========================================
# Generado automáticamente el ${new Date().toLocaleString()}

# Configuración del proyecto Firebase
VITE_FIREBASE_API_KEY=${apiKey}
VITE_FIREBASE_AUTH_DOMAIN=${authDomain}
VITE_FIREBASE_PROJECT_ID=${projectId}
VITE_FIREBASE_STORAGE_BUCKET=${storageBucket}
VITE_FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId}
VITE_FIREBASE_APP_ID=${appId}
VITE_GA_MEASUREMENT_ID=${measurementId || 'G-XXXXXXXXXX'}

# ========================================
# INSTRUCCIONES DE USO
# ========================================
# 1. Este archivo contiene las credenciales de Firebase
# 2. NO subas este archivo a Git (está en .gitignore)
# 3. Para cambiar de proyecto, ejecuta: node scripts/setup-env-config.cjs
# 4. Para desplegar: npm run build && firebase deploy
# ========================================
`;

    // Escribir archivo .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Archivo .env.local creado exitosamente!');
    console.log('📁 Ubicación:', envPath);

    // Crear archivo .firebaserc
    const firebasercContent = {
      projects: {
        default: projectId
      }
    };

    const firebasercPath = path.join(process.cwd(), '.firebaserc');
    fs.writeFileSync(firebasercPath, JSON.stringify(firebasercContent, null, 2));

    console.log('✅ Archivo .firebaserc actualizado!');
    console.log('📁 Proyecto activo:', projectId);

    // Mostrar próximos pasos
    console.log('\n🚀 PRÓXIMOS PASOS:');
    console.log('==================');
    console.log('1. Verificar configuración: npm run build');
    console.log('2. Iniciar sesión en Firebase: firebase login');
    console.log('3. Seleccionar proyecto: firebase use ' + projectId);
    console.log('4. Desplegar: firebase deploy');
    console.log('\n💡 Para cambiar de proyecto en el futuro, ejecuta este script nuevamente.');

  } catch (error) {
    console.error('❌ Error configurando variables de entorno:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Ejecutar configuración
setupEnvironment();
