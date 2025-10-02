import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import App from './App.tsx'

// Inicialización automática de tipos de licencias y disponibilidad
import { LicenseService } from './services/licenseService';
import { useLicenseStore } from './stores/licenseStore';

// Exponer el store globalmente para acceso desde consola
declare global {
  interface Window {
    licenseStore: typeof useLicenseStore;
  }
}

// Exponer el store en window
window.licenseStore = useLicenseStore;

async function initializeLicensesIfNeeded() {
  try {
    console.log('🚀 INICIO: Verificando y actualizando tipos de licencias...');

    // ✅ INICIALIZAR/ACTUALIZAR TODOS LOS TIPOS DE LICENCIAS
    console.log('🔄 Inicializando tipos de licencias...');
    await LicenseService.initializeLicenseTypes();

    // ✅ VERIFICAR QUE TODOS LOS TIPOS DE LICENCIAS EXISTEN
    console.log('🔍 Verificando que todos los tipos de licencias existen...');
    const licenseTypes = await LicenseService.getAllLicenseTypes();

    const expectedCodes = [
      'PG01', 'PS02', 'GG05', 'VG11', 'LG08', 'MG07', 'OM14', 'CT15',
      'EG03', 'ES04', 'DG06', 'AG09', 'JRV12', 'JU13', 'RH16'
    ];

    const existingCodes = licenseTypes.map((lt: { codigo: string }) => lt.codigo);
    const missingCodes = expectedCodes.filter(code => !existingCodes.includes(code));

    if (missingCodes.length > 0) {
      console.error('❌ FALTAN TIPOS DE LICENCIAS:', missingCodes);
      throw new Error(`Faltan ${missingCodes.length} tipos de licencias: ${missingCodes.join(', ')}`);
    }

    console.log(`✅ Todos los tipos de licencias están presentes (${licenseTypes.length}/${expectedCodes.length})`);

    // ✅ VERIFICACIÓN ESPECÍFICA DE LG08
    const lg08 = licenseTypes.find((lt: { codigo: string }) => lt.codigo === 'LG08');
    if (lg08) {
      console.log('🍼 LG08 - CONFIGURACIÓN FINAL:', {
        codigo: lg08.codigo,
        categoria: lg08.categoria,
        periodo_control: lg08.periodo_control,
        unidad_control: lg08.unidad_control,
        max_por_solicitud: lg08.max_por_solicitud,
        calculo_automatico_fecha_fin: lg08.calculo_automatico_fecha_fin,
        dias_calculo_automatico: lg08.dias_calculo_automatico
      });
    }

    console.log('✅ FIN: Tipos de licencias inicializados correctamente');
  } catch (error) {
    console.error('❌ Error inicializando tipos de licencias:', error);
    // No lanzamos el error para que la aplicación siga funcionando
  }
}

console.log('📋 MAIN.TSX: Iniciando aplicación...');
initializeLicensesIfNeeded().then(() => {
  console.log('📋 MAIN.TSX: Inicialización completada, renderizando App...');
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
