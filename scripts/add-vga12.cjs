#!/usr/bin/env node

/**
 * Script para agregar VGA12 a la base de datos si no existe
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDocs, query, where, serverTimestamp } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA5q4HOusvXW8wObkuyrB8it1y7Tyq1op0",
  authDomain: "licencias-gestor.firebaseapp.com",
  projectId: "licencias-gestor",
  storageBucket: "licencias-gestor.firebasestorage.app",
  messagingSenderId: "592435804089",
  appId: "1:592435804089:web:b2e6f3d3db466f18372868"
};

async function addVGA12() {
  console.log('🔍 Verificando si VGA12 existe y agregándolo si es necesario...\n');

  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const licenseTypesRef = collection(db, 'licenseTypes');

    // Verificar si VGA12 ya existe
    const q = query(licenseTypesRef, where('codigo', '==', 'VGA12'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      console.log('✅ VGA12 ya existe en la base de datos');
      const existingDoc = snapshot.docs[0].data();
      console.log('📋 Datos actuales:', {
        nombre: existingDoc.nombre,
        activo: existingDoc.activo,
        max_acumulacion: existingDoc.max_acumulacion
      });
      return;
    }

    // Agregar VGA12
    console.log('📝 Agregando VGA12 a la base de datos...');

    const vga12Data = {
      codigo: 'VGA12',
      nombre: 'Permiso Personal Acumulativo',
      categoria: 'DIAS',
      periodo_control: 'anual',
      cantidad_maxima: 15,
      unidad_control: 'dias',
      max_por_solicitud: 15,
      descripcion: 'Permisos personales acumulativos - 15 días/año, máximo acumulación 90 días',
      activo: true,
      max_acumulacion: 90,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const vga12Ref = doc(licenseTypesRef);
    await setDoc(vga12Ref, vga12Data);

    console.log('✅ VGA12 agregado exitosamente a la base de datos');
    console.log('📋 Datos agregados:', vga12Data);

  } catch (error) {
    console.error('❌ Error al agregar VGA12:', error);
    process.exit(1);
  }
}

// Ejecutar el script
if (require.main === module) {
  addVGA12();
}

module.exports = { addVGA12 };
