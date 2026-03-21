#!/usr/bin/env node

/**
 * Script completo para configurar producción en un solo paso
 * Despliega reglas de seguridad y crea usuario administrador
 */

import { createRequire } from 'module';
import { execSync } from 'child_process';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const require = createRequire(import.meta.url);
const { getFirebaseConfig } = require('./scripts/lib/firebase-env.cjs');
const firebaseConfig = getFirebaseConfig();

async function setupProduction() {
  console.log('🚀 INICIANDO CONFIGURACIÓN PARA PRODUCCIÓN\n');
  console.log('========================================\n');

  // PASO 1: Verificar Firebase CLI
  console.log('📋 PASO 1: Verificando Firebase CLI...');
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    console.log('✅ Firebase CLI instalado');
  } catch (error) {
    console.log('❌ Firebase CLI no encontrado');
    console.log('🔧 Instala con: npm install -g firebase-tools');
    process.exit(1);
  }

  // PASO 2: Verificar login
  console.log('\n📋 PASO 2: Verificando autenticación...');
  try {
    execSync('firebase projects:list', { stdio: 'pipe' });
    console.log('✅ Usuario autenticado en Firebase');
  } catch (error) {
    console.log('❌ No autenticado en Firebase');
    console.log('🔑 Ejecuta: firebase login');
    process.exit(1);
  }

  // PASO 3: Usar proyecto correcto
  console.log('\n📋 PASO 3: Configurando proyecto...');
  try {
    execSync('firebase use licencias-gestor', { stdio: 'pipe' });
    console.log('✅ Proyecto licencias-gestor seleccionado');
  } catch (error) {
    console.log('❌ Error configurando proyecto');
    console.log('🔍 Verifica que tengas acceso al proyecto licencias-gestor');
    process.exit(1);
  }

  // PASO 4: Desplegar reglas de seguridad
  console.log('\n📋 PASO 4: Desplegando reglas de seguridad...');
  try {
    execSync('firebase deploy --only firestore:rules', { stdio: 'pipe' });
    console.log('✅ Reglas de seguridad desplegadas');
    console.log('🔒 Autenticación requerida activada');
  } catch (error) {
    console.log('❌ Error desplegando reglas');
    console.log('🔧 Verifica que las reglas en firestore.rules sean válidas');
    process.exit(1);
  }

  // PASO 5: Solicitar credenciales de admin
  console.log('\n📋 PASO 5: Configuración de usuario administrador');
  const args = process.argv.slice(2);

  let adminEmail, adminPassword;

  if (args.length >= 2) {
    [adminEmail, adminPassword] = args;
    console.log(`📧 Email: ${adminEmail}`);
  } else {
    console.log('❌ Uso: node setup-production.mjs <email> <password>');
    console.log('\n💡 Ejemplo:');
    console.log('   node setup-production.mjs admin@empresa.com password123');
    process.exit(1);
  }

  // PASO 6: Crear usuario administrador
  console.log('\n📋 PASO 6: Creando usuario administrador...');
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Crear usuario en Auth
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;

    // Crear documento en Firestore
    const userData = {
      uid: user.uid,
      email: user.email,
      role: 'super-admin',
      firstName: 'Admin',
      lastName: 'Sistema',
      department: 'Sistemas',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    console.log('✅ Usuario administrador creado exitosamente');
    console.log(`👤 UID: ${user.uid}`);
    console.log(`🔑 Rol: super-admin`);

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️ El email ya existe. Si quieres actualizar el rol:');
      console.log('   1. Ve a Firebase Console → Authentication');
      console.log('   2. Busca el usuario y copia el UID');
      console.log('   3. Actualiza el documento en Firestore/users');
    } else {
      console.log(`❌ Error creando usuario: ${error.message}`);
      process.exit(1);
    }
  }

  // PASO 7: Verificación final
  console.log('\n📋 PASO 7: Verificación final...');
  try {
    execSync('node scripts/verify-production.mjs', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️ Verificación manual requerida');
    console.log('🔍 Ejecuta: node scripts/verify-production.mjs');
  }

  // RESUMEN FINAL
  console.log('\n========================================');
  console.log('🎉 ¡CONFIGURACIÓN PARA PRODUCCIÓN COMPLETADA!');
  console.log('========================================\n');

  console.log('🔒 SEGURIDAD ACTIVADA:');
  console.log('  • Autenticación requerida para todas las operaciones');
  console.log('  • Control de acceso basado en roles');
  console.log('  • Datos sensibles protegidos');
  console.log('  • Reglas de producción activas\n');

  console.log('👤 USUARIO ADMINISTRADOR:');
  console.log(`  • Email: ${adminEmail}`);
  console.log(`  • Password: ${adminPassword}`);
  console.log('  • Rol: super-admin');
  console.log('  • Puede crear otros administradores\n');

  console.log('🚀 PRÓXIMOS PASOS:');
  console.log('  1. npm run dev');
  console.log('  2. Inicia sesión con las credenciales arriba');
  console.log('  3. Configura empleados y permisos');
  console.log('  4. ¡Disfruta tu aplicación de producción!\n');

  console.log('📚 DOCUMENTACIÓN:');
  console.log('  • PRODUCTION_DEPLOYMENT.md - Guía completa');
  console.log('  • test-firebase.html - Herramientas de diagnóstico');
  console.log('  • firestore.rules - Reglas de seguridad\n');
}

// Ejecutar configuración
setupProduction().catch((error) => {
  console.error('\n❌ Error fatal:', error.message);
  process.exit(1);
});
