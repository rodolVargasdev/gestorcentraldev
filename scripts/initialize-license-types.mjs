#!/usr/bin/env node

/**
 * Script para inicializar tipos de licencias en la base de datos
 * Versión ES Module compatible con el proyecto
 */

import { createRequire } from 'module';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, query, where, writeBatch, setDoc, serverTimestamp } from 'firebase/firestore';

const require = createRequire(import.meta.url);
const { getFirebaseConfig } = require('./lib/firebase-env.cjs');
const firebaseConfig = getFirebaseConfig();

// Tipos de licencias predefinidos (basado en licenseTypes.ts)
const LICENSE_TYPES = [
  {
    codigo: 'PG01',
    nombre: 'Permiso Personal con Goce de Salario',
    categoria: 'HORAS',
    periodo_control: 'anual',
    cantidad_maxima: 40,
    unidad_control: 'horas',
    max_por_solicitud: 40,
    descripcion: 'Permisos personales pagados hasta 40 horas por año',
    activo: true
  },
  {
    codigo: 'PS02',
    nombre: 'Permiso Personal sin Goce de Salario',
    categoria: 'HORAS',
    periodo_control: 'anual',
    cantidad_maxima: 480,
    unidad_control: 'horas',
    max_por_solicitud: 480,
    descripcion: 'Permisos personales sin pago hasta 480 horas por año',
    activo: true
  },
  {
    codigo: 'GG05',
    nombre: 'Licencia por Enfermedad Gravísima de Pariente',
    categoria: 'DIAS',
    periodo_control: 'anual',
    cantidad_maxima: 17,
    unidad_control: 'dias',
    max_por_solicitud: 17,
    descripcion: 'Licencia para cuidar familiar con enfermedad grave',
    activo: true
  },
  {
    codigo: 'VG11',
    nombre: 'Vacaciones Anuales',
    categoria: 'DIAS',
    periodo_control: 'anual',
    cantidad_maxima: 15,
    unidad_control: 'dias',
    max_por_solicitud: 15,
    descripcion: 'Vacaciones anuales obligatorias - no acumulables',
    activo: true
  },
  {
    codigo: 'VGA12',
    nombre: 'Permiso Personal Acumulativo',
    categoria: 'DIAS',
    periodo_control: 'anual',
    cantidad_maxima: 15,
    unidad_control: 'dias',
    max_por_solicitud: 15,
    descripcion: 'Permisos personales acumulativos - 15 días/año, máximo acumulación 90 días',
    activo: true,
    max_acumulacion: 90
  },
  {
    codigo: 'LG08',
    nombre: 'Licencia por Lactancia Materna',
    categoria: 'OCASION',
    periodo_control: 'ninguno',
    cantidad_maxima: 0,
    unidad_control: 'dias',
    aplica_genero: 'F',
    max_por_solicitud: 185,
    descripcion: '6 meses desde el nacimiento - cálculo automático de fecha fin',
    activo: true,
    calculo_automatico_fecha_fin: true,
    dias_calculo_automatico: 185
  },
  {
    codigo: 'MG07',
    nombre: 'Licencia por Maternidad',
    categoria: 'OCASION',
    periodo_control: 'ninguno',
    cantidad_maxima: 0,
    unidad_control: 'dias',
    aplica_genero: 'F',
    max_por_solicitud: 112,
    descripcion: '112 días por embarazo - cálculo automático de fecha fin',
    activo: true,
    calculo_automatico_fecha_fin: true,
    dias_calculo_automatico: 112
  },
  {
    codigo: 'OM14',
    nombre: 'Licencia por Olvido de Marcación',
    categoria: 'OCASION',
    periodo_control: 'mensual',
    cantidad_maxima: 3,
    unidad_control: 'olvidos',
    max_por_solicitud: 1,
    descripcion: '3 olvidos de marcación por mes - con historial anual',
    activo: true,
    requiere_historial_anual: true
  },
  {
    codigo: 'CT15',
    nombre: 'Licencia por Cambio de Turno',
    categoria: 'OCASION',
    periodo_control: 'mensual',
    cantidad_maxima: 3,
    unidad_control: 'cambios',
    max_por_solicitud: 1,
    descripcion: '3 cambios de turno por mes - con historial anual',
    activo: true,
    requiere_historial_anual: true
  },
  {
    codigo: 'EG03',
    nombre: 'Licencia por Enfermedad con Goce de Salario',
    categoria: 'OCASION',
    periodo_control: 'ninguno',
    cantidad_maxima: 0,
    unidad_control: 'dias',
    max_por_solicitud: 3,
    descripcion: 'Licencia por enfermedad pagada, máximo 3 días por solicitud',
    activo: true
  },
  {
    codigo: 'ES04',
    nombre: 'Licencia por Enfermedad sin Goce de Salario',
    categoria: 'OCASION',
    periodo_control: 'ninguno',
    cantidad_maxima: 0,
    unidad_control: 'dias',
    max_por_solicitud: 999,
    descripcion: 'Licencia por enfermedad sin pago - ilimitada',
    activo: true
  },
  {
    codigo: 'DG06',
    nombre: 'Licencia por Duelo',
    categoria: 'OCASION',
    periodo_control: 'ninguno',
    cantidad_maxima: 0,
    unidad_control: 'dias',
    max_por_solicitud: 3,
    descripcion: 'Licencia por fallecimiento de familiar, máximo 3 días por evento',
    activo: true
  },
  {
    codigo: 'AG09',
    nombre: 'Licencia por Paternidad/Adopción',
    categoria: 'OCASION',
    periodo_control: 'ninguno',
    cantidad_maxima: 0,
    unidad_control: 'dias',
    max_por_solicitud: 3,
    descripcion: 'Licencia por nacimiento o adopción, máximo 3 días por evento',
    activo: true
  },
  {
    codigo: 'JRV12',
    nombre: 'Licencia por Juntas Receptoras de Votos',
    categoria: 'OCASION',
    periodo_control: 'ninguno',
    cantidad_maxima: 0,
    unidad_control: 'dias',
    max_por_solicitud: 999,
    descripcion: 'Licencia para participar en juntas electorales - solo registro histórico',
    activo: true
  },
  {
    codigo: 'JU13',
    nombre: 'Licencia por Conformar Jurado',
    categoria: 'OCASION',
    periodo_control: 'ninguno',
    cantidad_maxima: 0,
    unidad_control: 'dias',
    max_por_solicitud: 999,
    descripcion: 'Licencia para participar como jurado - solo registro histórico',
    activo: true
  },
  {
    codigo: 'RH16',
    nombre: 'Movimiento de Recurso Humano',
    categoria: 'OCASION',
    periodo_control: 'ninguno',
    cantidad_maxima: 0,
    unidad_control: 'dias',
    max_por_solicitud: 999,
    descripcion: 'Licencia para movimientos internos de RH - solo registro histórico',
    activo: true
  }
];

async function initializeLicenseTypes() {
  console.log('🚀 Inicializando tipos de licencias...\n');

  try {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const batch = writeBatch(db);
    let created = 0;
    let updated = 0;

    for (const licenseType of LICENSE_TYPES) {
      // Verificar si ya existe
      const q = query(
        collection(db, 'licenseTypes'),
        where('codigo', '==', licenseType.codigo)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Crear nuevo tipo de licencia
        const docRef = doc(collection(db, 'licenseTypes'));
        batch.set(docRef, {
          ...licenseType,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log(`✅ Tipo de licencia creado: ${licenseType.codigo} - ${licenseType.nombre}`);
        created++;
      } else {
        // Actualizar tipo existente si es necesario
        const existingDoc = snapshot.docs[0];
        const existingData = existingDoc.data();

        // Verificar si necesita actualización
        const needsUpdate =
          existingData.calculo_automatico_fecha_fin === undefined ||
          existingData.dias_calculo_automatico === undefined ||
          existingData.requiere_historial_anual === undefined ||
          existingData.max_por_solicitud === undefined ||
          existingData.descripcion === undefined;

        if (needsUpdate) {
          const docRef = doc(db, 'licenseTypes', existingDoc.id);

          const updateData = {
            updatedAt: serverTimestamp(),
            categoria: licenseType.categoria,
            periodo_control: licenseType.periodo_control,
            cantidad_maxima: licenseType.cantidad_maxima,
            unidad_control: licenseType.unidad_control,
            descripcion: licenseType.descripcion,
            activo: licenseType.activo,
            nombre: licenseType.nombre,
            ...(licenseType.calculo_automatico_fecha_fin !== undefined && { calculo_automatico_fecha_fin: licenseType.calculo_automatico_fecha_fin }),
            ...(licenseType.dias_calculo_automatico !== undefined && { dias_calculo_automatico: licenseType.dias_calculo_automatico }),
            ...(licenseType.requiere_historial_anual !== undefined && { requiere_historial_anual: licenseType.requiere_historial_anual }),
            ...(licenseType.aplica_genero !== undefined && { aplica_genero: licenseType.aplica_genero }),
            ...(licenseType.max_por_solicitud !== undefined && { max_por_solicitud: licenseType.max_por_solicitud }),
          };

          batch.update(docRef, updateData);
          console.log(`🔄 Tipo de licencia actualizado: ${licenseType.codigo} - ${licenseType.nombre}`);
          updated++;
        } else {
          console.log(`ℹ️ Tipo de licencia ya está actualizado: ${licenseType.codigo}`);
        }
      }
    }

    // Ejecutar batch
    await batch.commit();

    console.log(`\n🎉 Inicialización completada:`);
    console.log(`   ✅ Creados: ${created}`);
    console.log(`   🔄 Actualizados: ${updated}`);
    console.log(`   📊 Total procesados: ${LICENSE_TYPES.length}`);

  } catch (error) {
    console.error('❌ Error inicializando tipos de licencias:', error);
    throw error;
  }
}

// Ejecutar el script
initializeLicenseTypes()
  .then(() => {
    console.log('\n✅ Script ejecutado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en el script:', error);
    process.exit(1);
  });
