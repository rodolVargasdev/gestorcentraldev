import { LicenseService } from '../services/licenseService';

export async function updateLicenseTypesFromFrontend() {
  try {
    console.log('🔄 Inicializando tipos de licencia desde el frontend...');

    // Inicializar los tipos de licencia
    await LicenseService.initializeLicenseTypes();

    // Verificar que se crearon correctamente
    console.log('🔍 Verificando tipos de licencias creados...');
    const licenseTypes = await LicenseService.getAllLicenseTypes();

    const expectedCodes = [
      'PG01', 'PS02', 'GG05', 'VG11', 'LG08', 'MG07', 'OM14', 'CT15',
      'EG03', 'ES04', 'DG06', 'AG09', 'JRV12', 'JU13', 'RH16'
    ];

    const existingCodes = licenseTypes.map(lt => lt.codigo);
    const missingCodes = expectedCodes.filter(code => !existingCodes.includes(code));

    if (missingCodes.length > 0) {
      console.error('❌ TIPOS DE LICENCIAS FALTANTES:', missingCodes);
      throw new Error(`Faltan ${missingCodes.length} tipos de licencias`);
    }

    console.log(`✅ Todos los tipos de licencias están presentes (${licenseTypes.length}/${expectedCodes.length})`);
    console.log('🎉 Tipos de licencia inicializados correctamente');

    // Mostrar resumen
    licenseTypes.forEach(lt => {
      console.log(`   ${lt.codigo}: ${lt.nombre} (${lt.categoria})`);
    });

  } catch (error) {
    console.error('❌ Error inicializando tipos de licencia:', error);
    throw error;
  }
}

// Función para verificar estado de tipos de licencias
export async function checkLicenseTypesStatus() {
  try {
    console.log('🔍 Verificando estado de tipos de licencias...');

    const licenseTypes = await LicenseService.getAllLicenseTypes();

    if (licenseTypes.length === 0) {
      console.log('❌ No hay tipos de licencias en la base de datos');
      return false;
    }

    console.log(`📊 Encontrados ${licenseTypes.length} tipos de licencias:`);

    const expectedCodes = [
      'PG01', 'PS02', 'GG05', 'VG11', 'LG08', 'MG07', 'OM14', 'CT15',
      'EG03', 'ES04', 'DG06', 'AG09', 'JRV12', 'JU13', 'RH16'
    ];

    const existingCodes = licenseTypes.map(lt => lt.codigo);
    const missingCodes = expectedCodes.filter(code => !existingCodes.includes(code));

    if (missingCodes.length > 0) {
      console.log('❌ Faltan tipos de licencias:', missingCodes.join(', '));
      return false;
    }

    console.log('✅ Todos los tipos de licencias están presentes');
    return true;

  } catch (error) {
    console.error('❌ Error verificando tipos de licencias:', error);
    return false;
  }
}

// Funciones para ejecutar desde la consola del navegador
(window as any).updateLicenseTypes = updateLicenseTypesFromFrontend;
(window as any).checkLicenseTypes = checkLicenseTypesStatus;
