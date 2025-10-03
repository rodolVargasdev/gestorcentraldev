#!/usr/bin/env node

/**
 * Script para diagnosticar problemas de Firebase
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function diagnoseFirebase() {
  console.log('🔍 DIAGNÓSTICO DE FIREBASE');
  console.log('==========================\n');

  try {
    // 1. Verificar autenticación
    console.log('🔐 PASO 1: Verificando autenticación...');
    try {
      const authResult = execSync('firebase projects:list', { stdio: 'pipe', encoding: 'utf8' });
      console.log('✅ Autenticado en Firebase');
      console.log('📋 Proyectos disponibles:');
      console.log(authResult);
    } catch (error) {
      console.log('❌ No autenticado en Firebase');
      console.log('💡 Ejecuta: firebase login');
      return;
    }

    // 2. Verificar proyecto actual
    console.log('\n📁 PASO 2: Verificando proyecto actual...');
    try {
      const currentProject = execSync('firebase use', { stdio: 'pipe', encoding: 'utf8' });
      console.log('✅ Proyecto actual:', currentProject.trim());
    } catch (error) {
      console.log('❌ No hay proyecto seleccionado');
      console.log('💡 Ejecuta: firebase use [PROYECTO-ID]');
    }

    // 3. Verificar archivos de configuración
    console.log('\n📋 PASO 3: Verificando archivos de configuración...');
    
    if (fs.existsSync('.env.local')) {
      console.log('✅ Archivo .env.local encontrado');
      const envContent = fs.readFileSync('.env.local', 'utf8');
      const projectId = envContent.match(/VITE_FIREBASE_PROJECT_ID=(.+)/);
      if (projectId) {
        console.log('📁 Proyecto en .env.local:', projectId[1]);
      }
    } else {
      console.log('❌ Archivo .env.local no encontrado');
      console.log('💡 Ejecuta: npm run setup-env');
    }

    if (fs.existsSync('.firebaserc')) {
      console.log('✅ Archivo .firebaserc encontrado');
      const firebaserc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
      console.log('📁 Proyecto en .firebaserc:', firebaserc.projects?.default || 'No configurado');
    } else {
      console.log('❌ Archivo .firebaserc no encontrado');
      console.log('💡 Ejecuta: npm run setup-env');
    }

    // 4. Verificar permisos del proyecto
    console.log('\n🔑 PASO 4: Verificando permisos del proyecto...');
    try {
      execSync('firebase projects:list', { stdio: 'pipe' });
      console.log('✅ Tienes permisos para listar proyectos');
    } catch (error) {
      console.log('❌ No tienes permisos para listar proyectos');
      console.log('💡 Verifica que tengas acceso al proyecto');
    }

    // 5. Verificar servicios habilitados
    console.log('\n🛠️ PASO 5: Verificando servicios habilitados...');
    try {
      execSync('firebase use', { stdio: 'pipe' });
      console.log('✅ Proyecto seleccionado correctamente');
    } catch (error) {
      console.log('❌ Error con el proyecto seleccionado');
      console.log('💡 Verifica que el proyecto exista y tengas permisos');
    }

    // 6. Mostrar recomendaciones
    console.log('\n💡 RECOMENDACIONES:');
    console.log('==================');
    console.log('1. Si no estás autenticado: firebase login');
    console.log('2. Si no tienes permisos: contacta al administrador del proyecto');
    console.log('3. Si el proyecto no existe: crea uno nuevo en Firebase Console');
    console.log('4. Para configurar nuevo proyecto: npm run setup-env');
    console.log('5. Para verificar configuración: npm run verify-env');

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error.message);
  }
}

// Ejecutar diagnóstico
diagnoseFirebase();
