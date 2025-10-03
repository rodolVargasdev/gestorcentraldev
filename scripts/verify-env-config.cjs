#!/usr/bin/env node

/**
 * Script para verificar la configuración de variables de entorno
 */

const fs = require('fs');
const path = require('path');

function verifyEnvironment() {
  console.log('🔍 VERIFICANDO CONFIGURACIÓN DE VARIABLES DE ENTORNO');
  console.log('====================================================\n');

  const envPath = path.join(process.cwd(), '.env.local');
  const firebasercPath = path.join(process.cwd(), '.firebaserc');

  // Verificar archivo .env.local
  if (!fs.existsSync(envPath)) {
    console.log('❌ Archivo .env.local no encontrado');
    console.log('💡 Ejecuta: node scripts/setup-env-config.cjs');
    return false;
  }

  console.log('✅ Archivo .env.local encontrado');

  // Leer y verificar variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  let allVarsPresent = true;
  const missingVars = [];

  for (const varName of requiredVars) {
    if (!envContent.includes(varName)) {
      missingVars.push(varName);
      allVarsPresent = false;
    }
  }

  if (!allVarsPresent) {
    console.log('❌ Variables faltantes en .env.local:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    return false;
  }

  console.log('✅ Todas las variables requeridas están presentes');

  // Verificar .firebaserc
  if (!fs.existsSync(firebasercPath)) {
    console.log('❌ Archivo .firebaserc no encontrado');
    return false;
  }

  try {
    const firebaserc = JSON.parse(fs.readFileSync(firebasercPath, 'utf8'));
    if (firebaserc.projects && firebaserc.projects.default) {
      console.log('✅ Archivo .firebaserc configurado correctamente');
      console.log(`📁 Proyecto activo: ${firebaserc.projects.default}`);
    } else {
      console.log('❌ Configuración de proyecto no encontrada en .firebaserc');
      return false;
    }
  } catch (error) {
    console.log('❌ Error leyendo .firebaserc:', error.message);
    return false;
  }

  // Mostrar resumen de configuración
  console.log('\n📋 RESUMEN DE CONFIGURACIÓN:');
  console.log('============================');
  
  const lines = envContent.split('\n');
  lines.forEach(line => {
    if (line.startsWith('VITE_FIREBASE_') && line.includes('=')) {
      const [key, value] = line.split('=');
      const displayValue = value.length > 20 ? value.substring(0, 20) + '...' : value;
      console.log(`   ${key}: ${displayValue}`);
    }
  });

  console.log('\n✅ Configuración verificada correctamente!');
  console.log('\n🚀 PRÓXIMOS PASOS:');
  console.log('==================');
  console.log('1. Construir proyecto: npm run build');
  console.log('2. Iniciar sesión: firebase login');
  console.log('3. Desplegar: firebase deploy');

  return true;
}

// Ejecutar verificación
const isValid = verifyEnvironment();
process.exit(isValid ? 0 : 1);
