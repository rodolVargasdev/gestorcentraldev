import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getFirebaseConfigForScripts } from './firebaseEnvForScripts';

const firebaseConfig = getFirebaseConfigForScripts();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function debugDashboard() {
  console.log('🔍 DIAGNÓSTICO DEL DASHBOARD');
  console.log('================================');

  try {
    // Verificar empleados
    console.log('\n📊 EMPLEADOS:');
    console.log('----------------');
    const employeesSnapshot = await getDocs(collection(db, 'employees'));
    console.log(`Total empleados en Firebase: ${employeesSnapshot.size}`);
    
    if (employeesSnapshot.size > 0) {
      console.log('Empleados encontrados:');
      employeesSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${data.firstName} ${data.lastName} (${data.employeeId}) - Activo: ${data.isActive}`);
      });
    }

    // Verificar tipos de licencia
    console.log('\n📋 TIPOS DE LICENCIA:');
    console.log('----------------------');
    const licenseTypesSnapshot = await getDocs(collection(db, 'licenseTypes'));
    console.log(`Total tipos de licencia en Firebase: ${licenseTypesSnapshot.size}`);
    
    if (licenseTypesSnapshot.size > 0) {
      console.log('Tipos de licencia encontrados:');
      licenseTypesSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${data.code}: ${data.name} - Activo: ${data.isActive}`);
      });
    }

    // Verificar solicitudes
    console.log('\n📝 SOLICITUDES:');
    console.log('----------------');
    const requestsSnapshot = await getDocs(collection(db, 'requests'));
    console.log(`Total solicitudes en Firebase: ${requestsSnapshot.size}`);
    
    if (requestsSnapshot.size > 0) {
      console.log('Solicitudes encontradas:');
      requestsSnapshot.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const isThisMonth = createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
        
        console.log(`  - ID: ${doc.id} - Estado: ${data.status} - Creada: ${createdAt.toLocaleDateString()} ${isThisMonth ? '(Este mes)' : ''}`);
      });
    }

    // Calcular estadísticas del dashboard
    console.log('\n📈 ESTADÍSTICAS DEL DASHBOARD:');
    console.log('--------------------------------');
    
    const activeEmployees = employeesSnapshot.docs.filter(doc => doc.data().isActive).length;
    const activeLicenseTypes = licenseTypesSnapshot.docs.filter(doc => doc.data().isActive).length;
    const pendingRequests = requestsSnapshot.docs.filter(doc => doc.data().status === 'pending').length;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const approvedThisMonth = requestsSnapshot.docs.filter(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      return data.status === 'approved' && 
             createdAt.getMonth() === currentMonth && 
             createdAt.getFullYear() === currentYear;
    }).length;

    console.log(`✅ Empleados activos: ${activeEmployees}`);
    console.log(`⏳ Solicitudes pendientes: ${pendingRequests}`);
    console.log(`📋 Tipos de licencia activos: ${activeLicenseTypes}`);
    console.log(`✅ Aprobadas este mes: ${approvedThisMonth}`);

    console.log('\n🎯 CONCLUSIÓN:');
    console.log('---------------');
    if (activeEmployees === 0 && pendingRequests === 0 && activeLicenseTypes === 19 && approvedThisMonth === 0) {
      console.log('✅ Los datos están correctos - el dashboard debería mostrar:');
      console.log('   - Empleados: 0');
      console.log('   - Solicitudes pendientes: 0');
      console.log('   - Tipos de licencia: 19');
      console.log('   - Aprobadas este mes: 0');
    } else {
      console.log('❌ Los datos no están correctos - hay datos residuales en Firebase');
      console.log('   Recomendación: Limpiar la base de datos o verificar la lógica del dashboard');
    }

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  }
}

if (typeof window !== 'undefined') {
  (window as any).debugDashboard = debugDashboard;
}
