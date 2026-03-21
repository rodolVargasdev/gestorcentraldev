import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getFirebaseConfigForScripts } from './firebaseEnvForScripts';

const firebaseConfig = getFirebaseConfigForScripts();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function updatePhase2Config() {
  console.log('🔧 ACTUALIZANDO CONFIGURACIÓN FASE 2 - CONTROL POR EVENTOS');
  console.log('==========================================================');
  
  try {
    const licenseTypesSnapshot = await getDocs(collection(db, 'licenseTypes'));
    const licenses = licenseTypesSnapshot.docs;
    console.log(`✅ Total de licencias encontradas: ${licenses.length}`);

    // Configuración específica para FASE 2
    const phase2Config: Record<string, any> = {
      // MG07 - Maternidad (múltiples veces, pero solo uno después de que el anterior haya finalizado)
      '3RIqYxVUuX86C1l7O2mY': {
        eventControl: 'multiple',
        maxEventsPerYear: undefined, // Sin límite por año
        maxEventsTotal: undefined, // Sin límite total
        unitControl: 'events',
        periodControl: 'none',
        totalAvailable: 0 // Sin límite
      },
      // JU13 - Jurado (sin límites por año, solo uno después de que el anterior haya finalizado)
      'bvLgac9ka7FsN29tgphc': {
        eventControl: 'multiple',
        maxEventsPerYear: undefined, // Sin límite por año
        maxEventsTotal: undefined, // Sin límite total
        unitControl: 'events',
        periodControl: 'none',
        totalAvailable: 0 // Sin límite
      },
      // AG09 - Paternidad (sin límites por año, solo uno después de que el anterior haya finalizado)
      'skxqBHcR27i86iQ6NbXV': {
        eventControl: 'multiple',
        maxEventsPerYear: undefined, // Sin límite por año
        maxEventsTotal: undefined, // Sin límite total
        unitControl: 'events',
        periodControl: 'none',
        totalAvailable: 0 // Sin límite
      }
    };

    let updatedCount = 0;
    for (const licenseDoc of licenses) {
      const docId = licenseDoc.id;
      const data = licenseDoc.data();
      const code = data.code;
      const phase2Update = phase2Config[docId];

      if (phase2Update) {
        console.log(`🔄 Actualizando ${code} con configuración de eventos...`);
        await updateDoc(doc(db, 'licenseTypes', docId), phase2Update);
        updatedCount++;
        console.log(`✅ ${code} actualizado correctamente`);
      }
    }

    console.log(`\n🎉 ACTUALIZACIÓN COMPLETADA!`);
    console.log(`✅ Licencias actualizadas: ${updatedCount}`);
    console.log(`📋 Licencias configuradas:`);
    
    // Mostrar resumen de las licencias actualizadas
    for (const [docId, config] of Object.entries(phase2Config)) {
      const licenseDoc = licenses.find(doc => doc.id === docId);
      if (licenseDoc) {
        const data = licenseDoc.data();
        console.log(`   - ${data.code}: ${data.name}`);
        console.log(`     Event Control: ${config.eventControl}`);
        console.log(`     Max Events/Year: ${config.maxEventsPerYear}`);
        console.log(`     Max Events Total: ${config.maxEventsTotal || 'Sin límite'}`);
      }
    }

  } catch (error) {
    console.error('❌ Error durante la actualización:', error);
  }
}

if (typeof window !== 'undefined') {
  (window as any).updatePhase2Config = updatePhase2Config;
}
