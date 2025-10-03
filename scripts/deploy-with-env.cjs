#!/usr/bin/env node

/**
 * Script de despliegue automatizado usando variables de entorno
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function deployWithEnvironment() {
  console.log('🚀 DESPLIEGUE AUTOMATIZADO CON VARIABLES DE ENTORNO');
  console.log('==================================================\n');

  try {
    // 1. Verificar configuración
    console.log('🔍 PASO 1: Verificando configuración...');
    if (!fs.existsSync('.env.local')) {
      console.log('❌ Archivo .env.local no encontrado');
      console.log('💡 Ejecuta: node scripts/setup-env-config.cjs');
      process.exit(1);
    }

    if (!fs.existsSync('.firebaserc')) {
      console.log('❌ Archivo .firebaserc no encontrado');
      console.log('💡 Ejecuta: node scripts/setup-env-config.cjs');
      process.exit(1);
    }

    console.log('✅ Configuración verificada');

    // 2. Construir proyecto
    console.log('\n🔨 PASO 2: Construyendo proyecto...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Proyecto construido exitosamente');
    } catch (error) {
      console.log('❌ Error construyendo proyecto');
      process.exit(1);
    }

    // 3. Verificar y configurar autenticación de Firebase
    console.log('\n🔐 PASO 3: Verificando autenticación de Firebase...');
    try {
      execSync('firebase projects:list', { stdio: 'pipe' });
      console.log('✅ Autenticado en Firebase');
    } catch (error) {
      console.log('❌ No autenticado en Firebase');
      console.log('🔄 Iniciando proceso de autenticación...');
      
      try {
        console.log('🚪 Cerrando sesión actual...');
        execSync('firebase logout', { stdio: 'inherit' });
        
        console.log('🔑 Iniciando nueva sesión...');
        execSync('firebase login', { stdio: 'inherit' });
        
        console.log('✅ Autenticación completada');
      } catch (authError) {
        console.log('❌ Error durante la autenticación');
        console.log('💡 Ejecuta manualmente: firebase logout && firebase login');
        process.exit(1);
      }
    }

    // 4. Verificar y seleccionar proyecto correcto
    console.log('\n📁 PASO 4: Verificando proyecto seleccionado...');
    try {
      const currentProject = execSync('firebase use', { stdio: 'pipe', encoding: 'utf8' }).trim();
      console.log('✅ Proyecto actual:', currentProject);
      
      // Leer proyecto del .firebaserc
      const firebaserc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
      const expectedProject = firebaserc.projects.default;
      
      if (currentProject !== expectedProject) {
        console.log(`🔄 Cambiando a proyecto correcto: ${expectedProject}`);
        execSync(`firebase use ${expectedProject}`, { stdio: 'inherit' });
        console.log('✅ Proyecto seleccionado correctamente');
      } else {
        console.log('✅ Proyecto ya está seleccionado correctamente');
      }
    } catch (error) {
      console.log('⚠️ Advertencia: No se pudo verificar el proyecto');
      console.log('💡 Verifica manualmente: firebase use [PROYECTO-ID]');
    }

    // 5. Desplegar reglas de Firestore
    console.log('\n📋 PASO 5: Desplegando reglas de Firestore...');
    try {
      execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
      console.log('✅ Reglas de Firestore desplegadas');
    } catch (error) {
      console.log('⚠️ Advertencia: No se pudieron desplegar las reglas de Firestore');
      console.log('💡 Verifica que Firestore esté habilitado en tu proyecto');
    }

    // 6. Desplegar índices de Firestore
    console.log('\n📊 PASO 6: Desplegando índices de Firestore...');
    try {
      execSync('firebase deploy --only firestore:indexes', { stdio: 'inherit' });
      console.log('✅ Índices de Firestore desplegados');
    } catch (error) {
      console.log('⚠️ Advertencia: No se pudieron desplegar los índices de Firestore');
    }

    // 7. Desplegar hosting
    console.log('\n🌐 PASO 7: Desplegando aplicación...');
    try {
      execSync('firebase deploy --only hosting', { stdio: 'inherit' });
      console.log('✅ Aplicación desplegada exitosamente');
    } catch (error) {
      console.log('❌ Error desplegando aplicación');
      process.exit(1);
    }

    // 7. Mostrar información del despliegue
    console.log('\n🎉 DESPLIEGUE COMPLETADO!');
    console.log('=========================');
    
    // Leer información del proyecto
    const firebaserc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
    const projectId = firebaserc.projects.default;
    
    console.log(`📁 Proyecto: ${projectId}`);
    console.log(`🌐 URL: https://${projectId}.web.app`);
    console.log(`🔧 Console: https://console.firebase.google.com/project/${projectId}`);

    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('==================');
    console.log('1. Verificar que la aplicación funcione correctamente');
    console.log('2. Crear un usuario de prueba');
    console.log('3. Verificar que se inicialicen los tipos de licencias');
    console.log('4. Probar todas las funcionalidades');

  } catch (error) {
    console.error('❌ Error durante el despliegue:', error);
    process.exit(1);
  }
}

// Ejecutar despliegue
deployWithEnvironment();
