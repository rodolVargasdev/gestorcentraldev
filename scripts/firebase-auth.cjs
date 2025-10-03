#!/usr/bin/env node

/**
 * Script para manejar autenticación de Firebase
 * Incluye logout, login y selección de proyecto
 */

const { execSync } = require('child_process');
const fs = require('fs');
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

async function handleFirebaseAuth() {
  console.log('🔐 CONFIGURACIÓN DE AUTENTICACIÓN FIREBASE');
  console.log('==========================================\n');

  try {
    // 1. Verificar estado actual
    console.log('🔍 PASO 1: Verificando estado actual...');
    try {
      const projects = execSync('firebase projects:list', { stdio: 'pipe', encoding: 'utf8' });
      console.log('✅ Ya estás autenticado en Firebase');
      console.log('📋 Proyectos disponibles:');
      console.log(projects);
    } catch (error) {
      console.log('❌ No estás autenticado en Firebase');
    }

    // 2. Preguntar si quiere reautenticarse
    const shouldReauth = await question('\n¿Quieres reautenticarte? (y/n): ');
    
    if (shouldReauth.toLowerCase() === 'y' || shouldReauth.toLowerCase() === 'yes') {
      // 3. Logout
      console.log('\n🚪 PASO 2: Cerrando sesión actual...');
      try {
        execSync('firebase logout', { stdio: 'inherit' });
        console.log('✅ Sesión cerrada correctamente');
      } catch (error) {
        console.log('⚠️ Advertencia: No se pudo cerrar la sesión (puede que no estuvieras autenticado)');
      }

      // 4. Login
      console.log('\n🔑 PASO 3: Iniciando nueva sesión...');
      try {
        execSync('firebase login', { stdio: 'inherit' });
        console.log('✅ Autenticación completada');
      } catch (error) {
        console.log('❌ Error durante la autenticación');
        console.log('💡 Intenta ejecutar manualmente: firebase login');
        process.exit(1);
      }
    }

    // 5. Verificar proyecto actual
    console.log('\n📁 PASO 4: Verificando proyecto actual...');
    try {
      const currentProject = execSync('firebase use', { stdio: 'pipe', encoding: 'utf8' }).trim();
      console.log('✅ Proyecto actual:', currentProject);
    } catch (error) {
      console.log('❌ No hay proyecto seleccionado');
    }

    // 6. Seleccionar proyecto correcto
    if (fs.existsSync('.firebaserc')) {
      console.log('\n🔄 PASO 5: Seleccionando proyecto correcto...');
      try {
        const firebaserc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
        const expectedProject = firebaserc.projects.default;
        
        console.log(`📁 Proyecto esperado: ${expectedProject}`);
        
        try {
          const currentProject = execSync('firebase use', { stdio: 'pipe', encoding: 'utf8' }).trim();
          
          if (currentProject !== expectedProject) {
            console.log(`🔄 Cambiando a proyecto: ${expectedProject}`);
            execSync(`firebase use ${expectedProject}`, { stdio: 'inherit' });
            console.log('✅ Proyecto seleccionado correctamente');
          } else {
            console.log('✅ Proyecto ya está seleccionado correctamente');
          }
        } catch (error) {
          console.log(`🔄 Seleccionando proyecto: ${expectedProject}`);
          execSync(`firebase use ${expectedProject}`, { stdio: 'inherit' });
          console.log('✅ Proyecto seleccionado correctamente');
        }
      } catch (error) {
        console.log('❌ Error leyendo .firebaserc');
        console.log('💡 Ejecuta: npm run setup-env');
      }
    } else {
      console.log('❌ Archivo .firebaserc no encontrado');
      console.log('💡 Ejecuta: npm run setup-env');
    }

    // 7. Verificar configuración final
    console.log('\n✅ PASO 6: Verificando configuración final...');
    try {
      const currentProject = execSync('firebase use', { stdio: 'pipe', encoding: 'utf8' }).trim();
      console.log('✅ Proyecto activo:', currentProject);
      
      const projects = execSync('firebase projects:list', { stdio: 'pipe', encoding: 'utf8' });
      console.log('✅ Autenticación verificada');
      
      console.log('\n🎉 CONFIGURACIÓN COMPLETADA!');
      console.log('============================');
      console.log(`📁 Proyecto activo: ${currentProject}`);
      console.log('🔐 Autenticación: ✅');
      console.log('🚀 Listo para desplegar: npm run deploy-env');
      
    } catch (error) {
      console.log('❌ Error verificando configuración final');
      console.log('💡 Revisa la configuración manualmente');
    }

  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Ejecutar configuración de autenticación
handleFirebaseAuth();
