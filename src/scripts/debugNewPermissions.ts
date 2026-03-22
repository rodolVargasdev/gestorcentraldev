import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getFirebaseConfigForScripts } from './firebaseEnvForScripts';

const firebaseConfig = getFirebaseConfigForScripts();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function debugNewPermissions() {
  console.log('🔍 DIAGNÓSTICO DE NUEVOS PERMISOS');
  console.log('==================================');
  
  try {
    const licenseTypesSnapshot = await getDocs(collection(db, 'licenseTypes'));
    const licenses = licenseTypesSnapshot.docs;
    console.log(`✅ Total de licencias encontradas: ${licenses.length}`);

    // Buscar específicamente los nuevos permisos
    const newPermissions = ['OL01', 'CT01', 'IT01'];
    const foundPermissions: any[] = [];
    const allLicenses: any[] = [];

    licenses.forEach(doc => {
      const data = doc.data();
      allLicenses.push({
        id: doc.id,
        code: data.code,
        name: data.name,
        isActive: data.isActive,
        specialFields: data.specialFields
      });

      if (newPermissions.includes(data.code)) {
        foundPermissions.push({
          id: doc.id,
          code: data.code,
          name: data.name,
          isActive: data.isActive,
          specialFields: data.specialFields,
          totalAvailable: data.totalAvailable,
          periodControl: data.periodControl
        });
      }
    });

    console.log('\n📋 TODAS LAS LICENCIAS EN LA BASE DE DATOS:');
    console.log('============================================');
    allLicenses.forEach(license => {
      console.log(`   - ${license.code}: ${license.name} (Activo: ${license.isActive})`);
      if (license.specialFields) {
        console.log(`     Campos especiales: ${license.specialFields.type}`);
      }
    });

    console.log('\n🎯 NUEVOS PERMISOS ENCONTRADOS:');
    console.log('===============================');
    if (foundPermissions.length === 0) {
      console.log('❌ NO SE ENCONTRARON LOS NUEVOS PERMISOS (OL01, CT01, IT01)');
      console.log('💡 Esto significa que necesitan ser creados en la base de datos');
    } else {
      foundPermissions.forEach(permission => {
        console.log(`✅ ${permission.code}: ${permission.name}`);
        console.log(`   - Activo: ${permission.isActive}`);
        console.log(`   - Límite mensual: ${permission.totalAvailable}`);
        console.log(`   - Control de período: ${permission.periodControl}`);
        if (permission.specialFields) {
          console.log(`   - Campos especiales: ${permission.specialFields.type}`);
          console.log(`   - Número de campos: ${permission.specialFields.fields?.length || 0}`);
        }
      });
    }

    console.log('\n🔍 PERMISOS FALTANTES:');
    console.log('======================');
    const missingPermissions = newPermissions.filter(code => 
      !foundPermissions.find(p => p.code === code)
    );
    
    if (missingPermissions.length > 0) {
      missingPermissions.forEach(code => {
        console.log(`❌ ${code}: NO ENCONTRADO`);
      });
    } else {
      console.log('✅ Todos los nuevos permisos están presentes');
    }

    // Verificar permisos activos
    console.log('\n📊 ESTADÍSTICAS:');
    console.log('=================');
    const activeLicenses = allLicenses.filter(l => l.isActive === true || l.isActive === undefined);
    const inactiveLicenses = allLicenses.filter(l => l.isActive === false);
    
    console.log(`   - Total de licencias: ${allLicenses.length}`);
    console.log(`   - Licencias activas: ${activeLicenses.length}`);
    console.log(`   - Licencias inactivas: ${inactiveLicenses.length}`);
    console.log(`   - Nuevos permisos encontrados: ${foundPermissions.length}/${newPermissions.length}`);

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  }
}

if (typeof window !== 'undefined') {
  (window as any).debugNewPermissions = debugNewPermissions;
}
