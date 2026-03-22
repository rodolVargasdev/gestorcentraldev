import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getFirebaseConfigForScripts } from './firebaseEnvForScripts';

const firebaseConfig = getFirebaseConfigForScripts();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function clearEmployees() {
  console.log('🧹 LIMPIANDO EMPLEADOS DE EJEMPLO');
  console.log('==================================');

  try {
    // Obtener todos los empleados
    const employeesSnapshot = await getDocs(collection(db, 'employees'));
    
    if (employeesSnapshot.size === 0) {
      console.log('✅ No hay empleados para eliminar');
      return;
    }

    console.log(`📊 Encontrados ${employeesSnapshot.size} empleados para eliminar:`);
    
    // Mostrar empleados que se van a eliminar
    employeesSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.firstName} ${data.lastName} (${data.employeeId})`);
    });

    // Confirmar eliminación
    const confirmDelete = confirm(`¿Estás seguro de que quieres eliminar todos los ${employeesSnapshot.size} empleados?`);
    
    if (!confirmDelete) {
      console.log('❌ Operación cancelada por el usuario');
      return;
    }

    // Eliminar cada empleado
    const deletePromises = employeesSnapshot.docs.map(async (docSnapshot) => {
      try {
        await deleteDoc(doc(db, 'employees', docSnapshot.id));
        const data = docSnapshot.data();
        console.log(`✅ Eliminado: ${data.firstName} ${data.lastName} (${data.employeeId})`);
        return { success: true, employeeId: data.employeeId };
      } catch (error) {
        console.error(`❌ Error eliminando ${docSnapshot.id}:`, error);
        return { success: false, employeeId: docSnapshot.id, error };
      }
    });

    const results = await Promise.all(deletePromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log('\n🎯 RESUMEN DE LA LIMPIEZA:');
    console.log('==========================');
    console.log(`✅ Empleados eliminados exitosamente: ${successful}`);
    console.log(`❌ Empleados con error: ${failed}`);
    
    if (failed > 0) {
      console.log('\n❌ Empleados con errores:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.employeeId}: ${r.error}`);
      });
    }

    if (successful > 0) {
      console.log('\n✅ Base de datos de empleados limpiada exitosamente');
      console.log('🔄 Recarga el dashboard para ver los cambios');
    }

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
}

if (typeof window !== 'undefined') {
  (window as any).clearEmployees = clearEmployees;
}
