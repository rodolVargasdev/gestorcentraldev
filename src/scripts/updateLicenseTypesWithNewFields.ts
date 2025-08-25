import { writeBatch, doc, collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LICENSE_TYPES } from '../types/licenseTypes';

export async function updateLicenseTypesWithNewFields() {
  try {
    console.log('🔄 Actualizando tipos de licencia con nuevas propiedades...');
    
    const batch = writeBatch(db);
    const licenseTypesRef = collection(db, 'licenseTypes');
    
    // Obtener todos los tipos de licencia existentes
    const querySnapshot = await getDocs(licenseTypesRef);
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const licenseType = LICENSE_TYPES.find(lt => lt.codigo === data.codigo);
      
      if (licenseType) {
        // Actualizar con las nuevas propiedades
        const updates: any = {};
        
        if (licenseType.calculo_automatico_fecha_fin !== undefined) {
          updates.calculo_automatico_fecha_fin = licenseType.calculo_automatico_fecha_fin;
        }
        
        if (licenseType.dias_calculo_automatico !== undefined) {
          updates.dias_calculo_automatico = licenseType.dias_calculo_automatico;
        }
        
        if (licenseType.requiere_historial_anual !== undefined) {
          updates.requiere_historial_anual = licenseType.requiere_historial_anual;
        }
        
        if (Object.keys(updates).length > 0) {
          const docRef = doc(db, 'licenseTypes', docSnapshot.id);
          batch.update(docRef, updates);
          console.log(`✅ Actualizando ${data.codigo} con nuevas propiedades:`, updates);
        }
      }
    }
    
    await batch.commit();
    console.log('🎉 Tipos de licencia actualizados correctamente');
  } catch (error) {
    console.error('❌ Error actualizando tipos de licencia:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  updateLicenseTypesWithNewFields()
    .then(() => {
      console.log('✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}
