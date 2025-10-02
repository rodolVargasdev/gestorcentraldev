#!/usr/bin/env node

/**
 * Script simple para verificar tipos de licencias
 * Usa la configuración existente del proyecto
 */

// Simular el entorno del navegador para importar módulos ES
const path = require('path');

// Configurar el entorno para TypeScript
process.env.NODE_ENV = 'development';

// Importar usando require con path resolution
try {
  console.log('🔍 Verificando tipos de licencias...\n');

  // Verificar si existe el directorio node_modules
  const fs = require('fs');
  const projectRoot = path.resolve(__dirname, '..');

  if (!fs.existsSync(path.join(projectRoot, 'node_modules'))) {
    console.error('❌ node_modules no encontrado. Ejecuta: npm install');
    process.exit(1);
  }

  console.log('✅ node_modules encontrado');

  // Verificar package.json
  const packageJson = require(path.join(projectRoot, 'package.json'));
  console.log(`📦 Proyecto: ${packageJson.name}`);
  console.log(`🔥 Firebase version: ${packageJson.dependencies?.firebase || 'No encontrado'}`);

  // Verificar configuración de Firebase
  try {
    const firebaseConfig = require(path.join(projectRoot, 'src/lib/firebase.config.ts'));
    console.log('✅ Configuración de Firebase encontrada');
    console.log(`🔗 Proyecto: ${firebaseConfig.firebaseConfig?.projectId || firebaseConfig.projectId}`);
  } catch (error) {
    console.error('❌ Error cargando configuración de Firebase:', error.message);
  }

  console.log('\n📋 Recomendaciones:');
  console.log('1. Ejecuta: npm run dev');
  console.log('2. Abre la consola del navegador (F12)');
  console.log('3. Ejecuta: window.updateLicenseTypes()');
  console.log('4. O ejecuta: await LicenseService.getAllLicenseTypes()');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
