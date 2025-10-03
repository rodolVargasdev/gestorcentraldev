#!/usr/bin/env node

/**
 * Script para corregir la configuración de OM14 (Olvido de Marcación)
 * 
 * Este script actualiza la configuración de OM14 para que tenga:
 * 1. Los campos especiales correctos para olvido de marcación
 * 2. La configuración adecuada de disponibilidad
 * 3. La validación apropiada
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, query, where } = require('firebase/firestore');

// Configuración de Firebase (usar la misma que en el proyecto)
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "gestor-licencias-XXXXX.firebaseapp.com",
  projectId: "gestor-licencias-XXXXX",
  storageBucket: "gestor-licencias-XXXXX.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixOM14Config() {
  console.log('🔧 CORRIGIENDO CONFIGURACIÓN DE OM14');
  console.log('=====================================\n');

  try {
    // Buscar OM14 en licenseTypes
    console.log('1️⃣ Buscando OM14 en licenseTypes...');
    const licenseTypesSnapshot = await getDocs(collection(db, 'licenseTypes'));
    const om14Doc = licenseTypesSnapshot.docs.find(doc => doc.data().code === 'OM14');
    
    if (!om14Doc) {
      console.log('❌ OM14 no encontrado en licenseTypes');
      console.log('   Creando nueva configuración para OM14...');
      
      // Aquí podrías crear el documento si no existe
      console.log('⚠️  Necesitas ejecutar el script de creación de permisos primero');
      return;
    }

    const om14Data = om14Doc.data();
    console.log('✅ OM14 encontrado, verificando configuración actual...');
    console.log(`   - Código: ${om14Data.code}`);
    console.log(`   - Nombre: ${om14Data.name}`);
    console.log(`   - Categoría: ${om14Data.category}`);

    // Configuración correcta para OM14
    const correctOM14Config = {
      name: 'Licencia por Olvido de Marcación',
      description: 'Permiso para olvidos de marcación de entrada o salida',
      category: 'DIAS',
      unitControl: 'uses',
      periodControl: 'monthly',
      totalAvailable: 3, // 3 olvidos mensuales
      maxDaysPerRequest: 1,
      requiresJustification: true,
      hasSalary: true,
      isAccumulable: false,
      isTransferable: false,
      autoRenewal: true,
      isActive: true,
      specialFields: {
        type: 'om14',
        fields: [
          {
            name: 'fechaOlvido',
            type: 'date',
            label: 'Fecha del Olvido',
            required: true
          },
          {
            name: 'tipoOlvido',
            type: 'select',
            label: 'Tipo de Olvido',
            required: true,
            options: [
              { value: 'entrada', label: 'Olvido de Entrada' },
              { value: 'salida', label: 'Olvido de Salida' }
            ]
          },
          {
            name: 'justificacionOlvido',
            type: 'textarea',
            label: 'Justificación del Olvido',
            required: true,
            placeholder: 'Explique detalladamente por qué olvidó marcar...'
          }
        ]
      },
      updatedAt: new Date()
    };

    // Verificar si necesita actualización
    let needsUpdate = false;
    const currentFields = om14Data.specialFields?.fields || [];
    const correctFields = correctOM14Config.specialFields.fields;
    
    if (currentFields.length !== correctFields.length) {
      needsUpdate = true;
    } else {
      // Verificar si los campos son diferentes
      for (let i = 0; i < correctFields.length; i++) {
        if (currentFields[i]?.name !== correctFields[i].name) {
          needsUpdate = true;
          break;
        }
      }
    }

    if (om14Data.category !== correctOM14Config.category) {
      needsUpdate = true;
    }

    if (om14Data.periodControl !== correctOM14Config.periodControl) {
      needsUpdate = true;
    }

    if (om14Data.totalAvailable !== correctOM14Config.totalAvailable) {
      needsUpdate = true;
    }

    if (needsUpdate) {
      console.log('🔄 Actualizando configuración de OM14...');
      
      // Actualizar solo los campos que necesitan cambio
      const updateData = {};
      
      if (om14Data.category !== correctOM14Config.category) {
        updateData.category = correctOM14Config.category;
        console.log(`   - Actualizando categoría: ${om14Data.category} → ${correctOM14Config.category}`);
      }
      
      if (om14Data.periodControl !== correctOM14Config.periodControl) {
        updateData.periodControl = correctOM14Config.periodControl;
        console.log(`   - Actualizando período de control: ${om14Data.periodControl} → ${correctOM14Config.periodControl}`);
      }
      
      if (om14Data.totalAvailable !== correctOM14Config.totalAvailable) {
        updateData.totalAvailable = correctOM14Config.totalAvailable;
        console.log(`   - Actualizando total disponible: ${om14Data.totalAvailable} → ${correctOM14Config.totalAvailable}`);
      }
      
      if (om14Data.maxDaysPerRequest !== correctOM14Config.maxDaysPerRequest) {
        updateData.maxDaysPerRequest = correctOM14Config.maxDaysPerRequest;
        console.log(`   - Actualizando máximo por solicitud: ${om14Data.maxDaysPerRequest} → ${correctOM14Config.maxDaysPerRequest}`);
      }
      
      if (om14Data.specialFields?.type !== correctOM14Config.specialFields.type) {
        updateData.specialFields = correctOM14Config.specialFields;
        console.log(`   - Actualizando campos especiales: ${om14Data.specialFields?.type || 'ninguno'} → ${correctOM14Config.specialFields.type}`);
      } else if (currentFields.length !== correctFields.length) {
        updateData.specialFields = correctOM14Config.specialFields;
        console.log(`   - Actualizando campos especiales: ${currentFields.length} → ${correctFields.length} campos`);
      }
      
      updateData.updatedAt = correctOM14Config.updatedAt;
      
      await updateDoc(doc(db, 'licenseTypes', om14Doc.id), updateData);
      console.log('✅ Configuración de OM14 actualizada correctamente');
    } else {
      console.log('✅ OM14 ya tiene la configuración correcta');
    }

    // Verificar configuración final
    console.log('\n2️⃣ Verificando configuración final...');
    const updatedSnapshot = await getDocs(collection(db, 'licenseTypes'));
    const updatedOM14Doc = updatedSnapshot.docs.find(doc => doc.data().code === 'OM14');
    
    if (updatedOM14Doc) {
      const updatedData = updatedOM14Doc.data();
      console.log('✅ Configuración final de OM14:');
      console.log(`   - Código: ${updatedData.code}`);
      console.log(`   - Nombre: ${updatedData.name}`);
      console.log(`   - Categoría: ${updatedData.category}`);
      console.log(`   - Período de control: ${updatedData.periodControl}`);
      console.log(`   - Total disponible: ${updatedData.totalAvailable}`);
      console.log(`   - Máximo por solicitud: ${updatedData.maxDaysPerRequest}`);
      
      if (updatedData.specialFields) {
        console.log(`   - Tipo de campos especiales: ${updatedData.specialFields.type}`);
        console.log(`   - Número de campos: ${updatedData.specialFields.fields?.length || 0}`);
        
        if (updatedData.specialFields.fields) {
          updatedData.specialFields.fields.forEach((field, index) => {
            console.log(`     - Campo ${index + 1}: ${field.name} (${field.type}) - ${field.required ? 'Requerido' : 'Opcional'}`);
          });
        }
      }
    }

    console.log('\n🎉 CONFIGURACIÓN DE OM14 CORREGIDA EXITOSAMENTE!');
    console.log('==================================================');
    console.log('El tipo de licencia OM14 ahora está configurado correctamente para:');
    console.log('   - Manejar olvidos de marcación de entrada y salida');
    console.log('   - Requerir fecha del olvido, tipo y justificación');
    console.log('   - Controlar 3 olvidos mensuales por empleado');
    console.log('   - Integrarse correctamente con el formulario actualizado');

  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
    console.log('\n🔧 SOLUCIÓN DE PROBLEMAS:');
    console.log('1. Verificar que Firebase esté configurado correctamente');
    console.log('2. Asegurar que tienes permisos de escritura en la base de datos');
    console.log('3. Verificar que la colección licenseTypes existe');
  }
}

// Ejecutar la corrección
fixOM14Config()
  .then(() => {
    console.log('\n✅ Script de corrección completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el script de corrección:', error);
    process.exit(1);
  });
