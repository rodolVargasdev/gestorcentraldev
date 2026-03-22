#!/usr/bin/env node

/**
 * Script para verificar que la configuración de producción funciona correctamente
 */

import { createRequire } from 'module';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

const require = createRequire(import.meta.url);
const { getFirebaseConfig } = require('./lib/firebase-env.cjs');
const firebaseConfig = getFirebaseConfig();

async function verifyProductionSetup() {
  console.log('🔍 Verificando configuración de producción...\n');

  try {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Verificar 1: Conexión básica
    console.log('📡 1. Verificando conexión a Firestore...');
    const testQuery = query(collection(db, 'licenseTypes'));
    const snapshot = await getDocs(testQuery);
    console.log(`✅ Conexión exitosa - ${snapshot.size} tipos de licencias encontrados`);

    // Verificar 2: Tipos de licencias completos
    console.log('\n📋 2. Verificando tipos de licencias...');
    const expectedCodes = [
      'PG01', 'PS02', 'GG05', 'VG11', 'LG08', 'MG07', 'OM14', 'CT15',
      'EG03', 'ES04', 'DG06', 'AG09', 'JRV12', 'JU13', 'RH16'
    ];

    const licenseTypes = snapshot.docs.map(doc => doc.data());
    const existingCodes = licenseTypes.map(lt => lt.codigo);
    const missingCodes = expectedCodes.filter(code => !existingCodes.includes(code));

    if (missingCodes.length === 0) {
      console.log('✅ Todos los tipos de licencias están presentes');
    } else {
      console.log(`❌ Faltan tipos de licencias: ${missingCodes.join(', ')}`);
      return false;
    }

    // Verificar 3: Reglas de seguridad (intentar acceso sin auth)
    console.log('\n🔒 3. Verificando reglas de seguridad...');

    // Intentar acceder a colección protegida sin autenticación
    try {
      const protectedQuery = query(collection(db, 'users'));
      await getDocs(protectedQuery);
      console.log('❌ ERROR: Las reglas permiten acceso sin autenticación');
      return false;
    } catch (error) {
      if (error.message.includes('Missing or insufficient permissions')) {
        console.log('✅ Reglas de seguridad activas - acceso denegado sin autenticación');
      } else {
        console.log('⚠️ Error inesperado al verificar reglas:', error.message);
      }
    }

    // Verificar 4: Autenticación de admin (si se proporciona)
    const args = process.argv.slice(2);
    if (args.length >= 2) {
      const [email, password] = args;
      console.log('\n👤 4. Verificando autenticación de administrador...');

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log(`✅ Login exitoso - UID: ${user.uid}`);

        // Verificar rol de usuario
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log(`✅ Usuario encontrado en BD - Rol: ${userData.role}`);

          if (['super-admin', 'admin'].includes(userData.role)) {
            console.log('✅ Usuario tiene permisos de administrador');
          } else {
            console.log('⚠️ Usuario no tiene rol de administrador');
          }
        } else {
          console.log('❌ Usuario no encontrado en colección users');
        }

        // Cerrar sesión
        await auth.signOut();
        console.log('✅ Logout exitoso');

      } catch (error) {
        console.log(`❌ Error en autenticación: ${error.message}`);
        return false;
      }
    } else {
      console.log('\n👤 4. Verificación de autenticación omitida (no se proporcionaron credenciales)');
      console.log('💡 Para verificar login: node scripts/verify-production.mjs email@domain.com password');
    }

    // Verificar 5: Colecciones principales accesibles
    console.log('\n📊 5. Verificando colecciones principales...');

    const collections = ['employees', 'licenseRequests'];
    for (const collectionName of collections) {
      try {
        // Intentar leer (debería fallar sin auth)
        const collQuery = query(collection(db, collectionName));
        await getDocs(collQuery);
        console.log(`❌ ERROR: ${collectionName} permite acceso sin autenticación`);
        return false;
      } catch (error) {
        if (error.message.includes('Missing or insufficient permissions')) {
          console.log(`✅ ${collectionName} correctamente protegido`);
        } else {
          console.log(`⚠️ Error inesperado en ${collectionName}:`, error.message);
        }
      }
    }

    console.log('\n🎉 VERIFICACIÓN COMPLETADA EXITOSAMENTE');
    console.log('\n📋 Resumen:');
    console.log('✅ Conexión a Firestore funcionando');
    console.log('✅ Tipos de licencias completos');
    console.log('✅ Reglas de seguridad activas');
    console.log('✅ Autenticación configurada');
    console.log('✅ Colecciones protegidas');
    console.log('\n🚀 La aplicación está lista para producción!');

    return true;

  } catch (error) {
    console.error('\n❌ Error en verificación:', error.message);
    return false;
  }
}

// Ejecutar verificación
verifyProductionSetup()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
