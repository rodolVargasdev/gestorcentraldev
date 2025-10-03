#!/usr/bin/env node

/**
 * Script para migrar a un nuevo proyecto de Firebase
 * Maneja todo a través de variables de entorno
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
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

async function migrateFirebaseProject() {
  console.log('🔄 MIGRACIÓN A NUEVO PROYECTO FIREBASE');
  console.log('======================================\n');

  try {
    // 1. Backup del proyecto actual
    console.log('📦 PASO 1: Creando backup del proyecto actual...');
    const backupDir = `backup-${new Date().toISOString().split('T')[0]}`;
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // Backup de archivos importantes
    const filesToBackup = ['.env.local', '.firebaserc', 'firestore.rules', 'firestore.indexes.json'];
    filesToBackup.forEach(file => {
      if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(backupDir, file));
        console.log(`   ✅ Backup: ${file}`);
      }
    });

    console.log(`✅ Backup creado en: ${backupDir}\n`);

    // 2. Configurar nuevo proyecto
    console.log('🔧 PASO 2: Configurando nuevo proyecto Firebase...');
    
    const apiKey = await question('🔑 API Key del nuevo proyecto: ');
    const authDomain = await question('🌐 Auth Domain (proyecto.firebaseapp.com): ');
    const projectId = await question('📁 Project ID: ');
    const storageBucket = await question('🗄️ Storage Bucket (proyecto.appspot.com): ');
    const messagingSenderId = await question('📱 Messaging Sender ID: ');
    const appId = await question('📱 App ID: ');
    const measurementId = await question('📊 Measurement ID (opcional): ');

    // 3. Crear nuevo archivo .env.local
    console.log('\n📝 PASO 3: Creando archivo .env.local...');
    const envContent = `# ========================================
# CONFIGURACIÓN FIREBASE - VARIABLES DE ENTORNO
# ========================================
# Migrado el ${new Date().toLocaleString()}

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
# 1. Este archivo contiene las credenciales del nuevo proyecto Firebase
# 2. NO subas este archivo a Git (está en .gitignore)
# 3. Para cambiar de proyecto, ejecuta: node scripts/migrate-firebase-project.cjs
# 4. Para desplegar: npm run build && firebase deploy
# ========================================
`;

    fs.writeFileSync('.env.local', envContent);
    console.log('✅ Archivo .env.local creado');

    // 4. Actualizar .firebaserc
    console.log('\n📁 PASO 4: Actualizando .firebaserc...');
    const firebasercContent = {
      projects: {
        default: projectId
      }
    };

    fs.writeFileSync('.firebaserc', JSON.stringify(firebasercContent, null, 2));
    console.log('✅ Archivo .firebaserc actualizado');

    // 5. Verificar configuración
    console.log('\n🔍 PASO 5: Verificando configuración...');
    try {
      execSync('node scripts/verify-env-config.cjs', { stdio: 'inherit' });
      console.log('✅ Configuración verificada correctamente');
    } catch (error) {
      console.log('⚠️ Advertencia: No se pudo verificar la configuración automáticamente');
    }

    // 6. Construir proyecto
    console.log('\n🔨 PASO 6: Construyendo proyecto...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Proyecto construido exitosamente');
    } catch (error) {
      console.log('❌ Error construyendo proyecto:', error.message);
      console.log('💡 Revisa la configuración y vuelve a intentar');
    }

    // 6. Procesar autenticación de Firebase
    console.log('\n🔐 PASO 6: Configurando autenticación de Firebase...');
    
    const shouldReauth = await question('¿Quieres reautenticarte en Firebase? (y/n): ');
    if (shouldReauth.toLowerCase() === 'y' || shouldReauth.toLowerCase() === 'yes') {
      try {
        console.log('🚪 Cerrando sesión actual...');
        execSync('firebase logout', { stdio: 'inherit' });
        
        console.log('🔑 Iniciando nueva sesión...');
        execSync('firebase login', { stdio: 'inherit' });
        
        console.log('📁 Seleccionando proyecto...');
        execSync(`firebase use ${projectId}`, { stdio: 'inherit' });
        
        console.log('✅ Autenticación configurada correctamente');
      } catch (error) {
        console.log('⚠️ Advertencia: No se pudo configurar la autenticación automáticamente');
        console.log('💡 Configura manualmente: firebase logout && firebase login && firebase use ' + projectId);
      }
    }

    // 7. Mostrar próximos pasos
    console.log('\n🚀 PRÓXIMOS PASOS:');
    console.log('==================');
    console.log('1. Configurar servicios de Firebase:');
    console.log('   - Habilitar Authentication (Email/Password)');
    console.log('   - Crear Firestore Database');
    console.log('   - Configurar Hosting');
    console.log('');
    console.log('2. Desplegar automáticamente:');
    console.log('   npm run deploy-env');
    console.log('');
    console.log('3. O desplegar manualmente:');
    console.log('   firebase deploy --only firestore:rules');
    console.log('   firebase deploy --only hosting');
    console.log('');
    console.log('4. Verificar funcionamiento:');
    console.log('   - Crear un usuario de prueba');
    console.log('   - Verificar que se inicialicen los tipos de licencias');
    console.log('   - Probar la funcionalidad completa');

    console.log('\n✅ MIGRACIÓN COMPLETADA!');
    console.log('========================');
    console.log(`📁 Nuevo proyecto: ${projectId}`);
    console.log(`📦 Backup guardado en: ${backupDir}`);
    console.log('💡 Para revertir, restaura los archivos del backup');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Ejecutar migración
migrateFirebaseProject();
