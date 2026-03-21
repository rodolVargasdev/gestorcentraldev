#!/usr/bin/env node

/**
 * Script para verificar qué tipos de licencias existen en la base de datos
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const { getFirebaseConfig } = require('./lib/firebase-env.cjs');
const firebaseConfig = getFirebaseConfig();

async function checkLicenseTypes() {
  console.log('🔍 Verificando tipos de licencias en la base de datos...\n');

  try {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Obtener todos los tipos de licencias
    const licenseTypesSnapshot = await getDocs(collection(db, 'licenseTypes'));

    if (licenseTypesSnapshot.empty) {
      console.log('❌ No se encontraron tipos de licencias en la base de datos');
      console.log('📋 Deberían existir 16 tipos de licencias según el lineamiento');

      const expectedCodes = [
        'PG01', 'PS02', 'GG05', 'VG11', 'LG08', 'MG07', 'OM14', 'CT15',
        'EG03', 'ES04', 'DG06', 'AG09', 'JRV12', 'JU13', 'RH16'
      ];

      console.log('\n📋 Códigos esperados:', expectedCodes.join(', '));
      return false;
    }

    console.log(`✅ Encontrados ${licenseTypesSnapshot.size} tipos de licencias:\n`);

    const licenseTypes = [];
    licenseTypesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      licenseTypes.push(data);

      console.log(`📋 ${data.codigo} - ${data.nombre}`);
      console.log(`   Categoría: ${data.categoria} | Control: ${data.periodo_control}`);
      console.log(`   Máximo: ${data.cantidad_maxima} ${data.unidad_control}`);
      if (data.max_por_solicitud) {
        console.log(`   Máx por solicitud: ${data.max_por_solicitud}`);
      }
      console.log(`   Activo: ${data.activo ? '✅' : '❌'}`);
      console.log('');
    });

    // Verificar que todos los tipos esperados existan
    const expectedCodes = [
      'PG01', 'PS02', 'GG05', 'VG11', 'VGA12', 'LG08', 'MG07', 'OM14', 'CT15',
      'EG03', 'ES04', 'DG06', 'AG09', 'JRV12', 'JU13', 'RH16'
    ];

    const existingCodes = licenseTypes.map(lt => lt.codigo);
    const missingCodes = expectedCodes.filter(code => !existingCodes.includes(code));

    if (missingCodes.length > 0) {
      console.log(`❌ Faltan ${missingCodes.length} tipos de licencias:`);
      missingCodes.forEach(code => console.log(`   - ${code}`));
      return false;
    }

    console.log('✅ Todos los tipos de licencias están presentes en la base de datos');

    // Verificar específicamente VGA12
    console.log('\n🔍 Verificando VGA12 específicamente...');
    const vga12Exists = licenseTypes.some(lt => lt.codigo === 'VGA12');
    if (vga12Exists) {
        console.log('✅ VGA12 encontrado en la base de datos');
        const vga12 = licenseTypes.find(lt => lt.codigo === 'VGA12');
        console.log('📋 Detalles VGA12:', {
            nombre: vga12.nombre,
            activo: vga12.activo,
            max_acumulacion: vga12.max_acumulacion
        });
    } else {
        console.log('❌ VGA12 NO encontrado en la base de datos');
        console.log('💡 Ejecuta el script de inicialización para agregarlo');
    }

    return true;

  } catch (error) {
    console.error('❌ Error al verificar tipos de licencias:', error);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Verificando estado de tipos de licencias\n');

    const success = await checkLicenseTypes();

    if (!success) {
      console.log('\n🔧 Recomendaciones:');
      console.log('1. Ejecuta la aplicación para inicializar los tipos automáticamente');
      console.log('2. O ejecuta: node scripts/initialize-license-types.cjs');
      console.log('3. Verifica la configuración de Firebase');
    } else {
      console.log('\n✅ Los tipos de licencias están correctamente configurados');
    }

  } catch (error) {
    console.error('\n❌ Error en la verificación:', error);
    process.exit(1);
  }
}

// Ejecutar el script
if (require.main === module) {
  main();
}

module.exports = { checkLicenseTypes };
