import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getFirebaseConfigForScripts } from './firebaseEnvForScripts';

const firebaseConfig = getFirebaseConfigForScripts();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function checkFirestoreData() {
  console.log('🔍 Verificando datos en Firestore...');
  
  try {
    // Verificar empleados
    console.log('\n📋 Verificando colección "employees"...');
    const employeesSnapshot = await getDocs(collection(db, 'employees'));
    console.log(`Empleados encontrados: ${employeesSnapshot.size}`);
    
    if (employeesSnapshot.size > 0) {
      employeesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`- ID: ${doc.id}`);
        console.log(`  Empleado: ${data.firstName} ${data.lastName}`);
        console.log(`  Email: ${data.email}`);
        console.log(`  Departamento: ${data.department}`);
        console.log(`  Activo: ${data.isActive}`);
        console.log('---');
      });
    } else {
      console.log('❌ No hay empleados en la base de datos');
    }

    // Verificar tipos de licencia
    console.log('\n📋 Verificando colección "licenseTypes"...');
    const licenseTypesSnapshot = await getDocs(collection(db, 'licenseTypes'));
    console.log(`Tipos de licencia encontrados: ${licenseTypesSnapshot.size}`);
    
    if (licenseTypesSnapshot.size > 0) {
      licenseTypesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`- ID: ${doc.id}`);
        console.log(`  Código: ${data.code}`);
        console.log(`  Nombre: ${data.name}`);
        console.log(`  Categoría: ${data.category}`);
        console.log(`  Activo: ${data.isActive}`);
        console.log(`  MaxDaysPerRequest: ${data.maxDaysPerRequest}`);
        console.log(`  AutoCalculateEndDate: ${data.autoCalculateEndDate}`);
        console.log(`  AutoCalculateDays: ${data.autoCalculateDays}`);
        console.log('---');
      });
    } else {
      console.log('❌ No hay tipos de licencia en la base de datos');
    }

    // Verificar si hay otras colecciones
    console.log('\n📋 Verificando otras colecciones...');
    const collections = ['departments', 'requests', 'users'];
    
    for (const collectionName of collections) {
      try {
        const snapshot = await getDocs(collection(db, collectionName));
        console.log(`${collectionName}: ${snapshot.size} documentos`);
      } catch (error) {
        console.log(`${collectionName}: Error al acceder`);
      }
    }

  } catch (error) {
    console.error('❌ Error al verificar datos:', error);
  }
}

// Función para verificar un documento específico
export async function checkSpecificDocument(collectionName: string, docId: string) {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log(`✅ Documento encontrado en ${collectionName}/${docId}:`);
      console.log(docSnap.data());
    } else {
      console.log(`❌ Documento no encontrado en ${collectionName}/${docId}`);
    }
  } catch (error) {
    console.error(`❌ Error al verificar documento ${collectionName}/${docId}:`, error);
  }
}

// Función para verificar la configuración de Firebase
export function checkFirebaseConfig() {
  console.log('🔧 Configuración de Firebase:');
  console.log('Project ID:', firebaseConfig.projectId);
  console.log('Auth Domain:', firebaseConfig.authDomain);
  console.log('API Key:', firebaseConfig.apiKey ? 'Configurada' : 'No configurada');
}

// Ejecutar verificación si se llama directamente
if (typeof window === 'undefined') {
  // Solo ejecutar en Node.js
  checkFirebaseConfig();
  checkFirestoreData().then(() => {
    console.log('\n✅ Verificación completada');
  }).catch((error) => {
    console.error('❌ Error en verificación:', error);
  });
}
