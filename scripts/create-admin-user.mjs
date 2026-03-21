#!/usr/bin/env node

/**
 * Script para crear el primer usuario administrador
 * Uso: node scripts/create-admin-user.mjs <email> <password> [role]
 */

import { createRequire } from 'module';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const require = createRequire(import.meta.url);
const { getFirebaseConfig } = require('./lib/firebase-env.cjs');
const firebaseConfig = getFirebaseConfig();

// Función para crear usuario administrador
async function createAdminUser(email, password, role = 'super-admin') {
  console.log('🚀 Creando usuario administrador...\n');

  try {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('📧 Creando usuario en Firebase Auth...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('💾 Guardando datos del usuario en Firestore...');
    const userData = {
      uid: user.uid,
      email: user.email,
      role: role,
      firstName: 'Admin',
      lastName: 'Sistema',
      department: 'Sistemas',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    console.log('\n✅ Usuario administrador creado exitosamente!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Rol: ${role}`);
    console.log(`🆔 UID: ${user.uid}`);

    console.log('\n🔒 IMPORTANTE:');
    console.log('- Este es el único usuario con rol super-admin');
    console.log('- Puede crear otros administradores desde la aplicación');
    console.log('- Cambia la contraseña después del primer login');

  } catch (error) {
    console.error('\n❌ Error creando usuario administrador:', error.message);

    if (error.code === 'auth/email-already-in-use') {
      console.log('💡 El email ya está registrado. Si quieres cambiar el rol:');
      console.log('   1. Ve a Firebase Console → Authentication → Users');
      console.log('   2. Busca el usuario y copia el UID');
      console.log('   3. Actualiza el documento en Firestore collection "users"');
    }

    throw error;
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('❌ Uso: node scripts/create-admin-user.mjs <email> <password> [role]');
    console.log('\n📋 Ejemplos:');
    console.log('  node scripts/create-admin-user.mjs admin@empresa.com password123');
    console.log('  node scripts/create-admin-user.mjs admin@empresa.com password123 admin');
    console.log('\n🔑 Roles disponibles: super-admin, admin, manager, viewer');
    process.exit(1);
  }

  const [email, password, role = 'super-admin'] = args;

  // Validar email básico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ Email inválido');
    process.exit(1);
  }

  // Validar password
  if (password.length < 6) {
    console.error('❌ La contraseña debe tener al menos 6 caracteres');
    process.exit(1);
  }

  // Validar rol
  const validRoles = ['super-admin', 'admin', 'manager', 'viewer'];
  if (!validRoles.includes(role)) {
    console.error(`❌ Rol inválido. Roles válidos: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  try {
    await createAdminUser(email, password, role);
    console.log('\n🎉 ¡Configuración completada!');
    console.log('Ahora puedes iniciar sesión en la aplicación con estas credenciales.');
  } catch (error) {
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createAdminUser };
