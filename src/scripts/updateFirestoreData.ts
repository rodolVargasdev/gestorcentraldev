import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getFirebaseConfigForScripts } from './firebaseEnvForScripts';

const firebaseConfig = getFirebaseConfigForScripts();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Configuración de tipos de licencia para FASE 1
const licenseTypeUpdates: Record<string, any> = {
  // EG03 - Enfermedad con Goce (máx 3 días)
  'PG4nUq7QAAhZJWdGtL3n': {
    isActive: true,
    maxDaysPerRequest: 3,
    autoCalculateEndDate: false,
    autoCalculateDays: null,
    requiresJustification: true,
    hasSalary: true,
    unitControl: 'days',
    periodControl: 'none',
    totalAvailable: 0
  },
  // DG06 - Duelo (máx 3 días)
  '6ljuwaBBmPEZbTjYZMMf': {
    isActive: true,
    maxDaysPerRequest: 3,
    autoCalculateEndDate: false,
    autoCalculateDays: null,
    requiresJustification: true,
    hasSalary: true,
    unitControl: 'days',
    periodControl: 'none',
    totalAvailable: 0
  },
  // AG09 - Paternidad (máx 3 días)
  'skxqBHcR27i86iQ6NbXV': {
    isActive: true,
    maxDaysPerRequest: 3,
    autoCalculateEndDate: false,
    autoCalculateDays: null,
    requiresJustification: true,
    hasSalary: true,
    unitControl: 'days',
    periodControl: 'none',
    totalAvailable: 0
  },
  // LG08 - Lactancia Materna (auto-calcula 180 días)
  '8Y6ZToI4nHv0Q1ugfM7j': {
    isActive: true,
    maxDaysPerRequest: 180,
    autoCalculateEndDate: true,
    autoCalculateDays: 180,
    requiresJustification: true,
    hasSalary: true,
    unitControl: 'days',
    periodControl: 'none',
    totalAvailable: 0
  }
};

// Departamentos para asignar a empleados
const departments = [
  'Tecnología',
  'Recursos Humanos', 
  'Finanzas',
  'Marketing',
  'Operaciones',
  'Administración'
];

export async function updateFirestoreData() {
  console.log('🔄 Iniciando actualización de datos en Firestore...');
  
  try {
    // 1. Actualizar tipos de licencia
    console.log('\n📋 Actualizando tipos de licencia...');
    const licenseTypesSnapshot = await getDocs(collection(db, 'licenseTypes'));
    
    for (const licenseDoc of licenseTypesSnapshot.docs) {
      const docId = licenseDoc.id;
      const updates = licenseTypeUpdates[docId];
      
      if (updates) {
        console.log(`✅ Actualizando ${licenseDoc.data().code} (${licenseDoc.data().name})`);
        await updateDoc(doc(db, 'licenseTypes', docId), updates);
             } else {
         // Actualizar campos básicos para otros tipos (mantener activas las existentes)
         console.log(`ℹ️ Actualizando campos básicos para ${licenseDoc.data().code}`);
         await updateDoc(doc(db, 'licenseTypes', docId), {
           isActive: true, // Todas las licencias existentes deben estar activas
           requiresJustification: true,
           hasSalary: true,
           unitControl: 'days',
           periodControl: 'annual',
           totalAvailable: 0
         });
       }
    }

    // 2. Asignar departamentos a empleados
    console.log('\n👥 Asignando departamentos a empleados...');
    const employeesSnapshot = await getDocs(collection(db, 'employees'));
    
    let deptIndex = 0;
    for (const employeeDoc of employeesSnapshot.docs) {
      const department = departments[deptIndex % departments.length];
      console.log(`✅ Asignando ${department} a ${employeeDoc.data().firstName} ${employeeDoc.data().lastName}`);
      
      await updateDoc(doc(db, 'employees', employeeDoc.id), {
        department: department
      });
      
      deptIndex++;
    }

    console.log('\n✅ Actualización completada exitosamente!');
    console.log('\n📊 Resumen de cambios:');
    console.log('- Tipos de licencia actualizados con campos faltantes');
    console.log('- Empleados asignados a departamentos');
    console.log('- Configuración de FASE 1 aplicada (EG03, DG06, AG09, LG08)');
    
  } catch (error) {
    console.error('❌ Error durante la actualización:', error);
  }
}

// Función para verificar el estado después de la actualización
export async function verifyUpdates() {
  console.log('\n🔍 Verificando actualizaciones...');
  
  try {
    // Verificar tipos de licencia actualizados
    const licenseTypesSnapshot = await getDocs(collection(db, 'licenseTypes'));
    
    console.log('\n📋 Tipos de licencia después de actualización:');
    for (const doc of licenseTypesSnapshot.docs) {
      const data = doc.data();
      if (data.code === 'EG03' || data.code === 'DG06' || data.code === 'AG09' || data.code === 'LG08') {
        console.log(`- ${data.code}: isActive=${data.isActive}, maxDays=${data.maxDaysPerRequest}, autoCalc=${data.autoCalculateEndDate}`);
      }
    }

    // Verificar empleados con departamentos
    const employeesSnapshot = await getDocs(collection(db, 'employees'));
    console.log('\n👥 Empleados con departamentos:');
    employeesSnapshot.docs.slice(0, 3).forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.firstName} ${data.lastName}: ${data.department}`);
    });

  } catch (error) {
    console.error('❌ Error al verificar actualizaciones:', error);
  }
}

// Ejecutar si se llama directamente
if (typeof window !== 'undefined') {
  // En el navegador, agregar al objeto global
  (window as any).updateFirestoreData = updateFirestoreData;
  (window as any).verifyUpdates = verifyUpdates;
} else {
  // En Node.js, ejecutar directamente
  updateFirestoreData().then(() => {
    return verifyUpdates();
  });
}
