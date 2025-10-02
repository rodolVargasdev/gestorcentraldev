import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  setDoc,
  deleteDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { type LicenseType } from '../types/licenseTypes';
import { type Employee, type LicenciaHora, type LicenciaDia, type LicenciaOcasion, type LicenseRequest, type CreateLicenseRequestData } from '../types/index';
import { getCurrentDateInElSalvador } from '../utils/dateUtils';

export class LicenseService {
  private static licenseTypesCollection = 'licenseTypes';
  private static employeesCollection = 'employees';
  private static licenseRequestsCollection = 'licenseRequests';

  // ========================================
  // GESTIÓN DE TIPOS DE LICENCIAS
  // ========================================

  // Inicializar tipos de licencias predefinidos
  static async initializeLicenseTypes(): Promise<void> {
    try {
      console.log('🚀 Inicializando tipos de licencias...');
      
      const batch = writeBatch(db);
      const { LICENSE_TYPES } = await import('../types/licenseTypes');
      
      for (const licenseType of LICENSE_TYPES) {
        // Verificar si ya existe
        const q = query(
          collection(db, this.licenseTypesCollection),
          where('codigo', '==', licenseType.codigo)
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          const docRef = doc(collection(db, this.licenseTypesCollection));
          batch.set(docRef, {
            ...licenseType,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          console.log(`✅ Tipo de licencia creado: ${licenseType.codigo} - ${licenseType.nombre}`);
        } else {
          // Actualizar documento existente con nuevas propiedades
          const existingDoc = snapshot.docs[0];
          const existingData = existingDoc.data();
          
          // ✅ FORZAR ACTUALIZACIÓN COMPLETA PARA LG08
          const isLG08 = licenseType.codigo === 'LG08';
          const needsUpdate = 
            isLG08 || // Forzar actualización de LG08
            existingData.calculo_automatico_fecha_fin === undefined ||
            existingData.dias_calculo_automatico === undefined ||
            existingData.requiere_historial_anual === undefined ||
            existingData.max_por_solicitud === undefined ||
            existingData.descripcion === undefined;
          
          if (needsUpdate) {
            const docRef = doc(db, this.licenseTypesCollection, existingDoc.id);
            
                         // Crear objeto de actualización con TODAS las propiedades
            const updateData = {
              updatedAt: serverTimestamp(),
              // ✅ ACTUALIZAR TODAS LAS PROPIEDADES CORE
              categoria: licenseType.categoria,
              periodo_control: licenseType.periodo_control,
              cantidad_maxima: licenseType.cantidad_maxima,
              unidad_control: licenseType.unidad_control,
              descripcion: licenseType.descripcion,
              activo: licenseType.activo,
              nombre: licenseType.nombre,
              // ✅ AGREGAR PROPIEDADES NUEVAS SI EXISTEN
              ...(licenseType.calculo_automatico_fecha_fin !== undefined && { calculo_automatico_fecha_fin: licenseType.calculo_automatico_fecha_fin }),
              ...(licenseType.dias_calculo_automatico !== undefined && { dias_calculo_automatico: licenseType.dias_calculo_automatico }),
              ...(licenseType.requiere_historial_anual !== undefined && { requiere_historial_anual: licenseType.requiere_historial_anual }),
              // ✅ AGREGAR aplica_genero SOLO SI NO ES UNDEFINED
              ...(licenseType.aplica_genero !== undefined && { aplica_genero: licenseType.aplica_genero }),
              // ✅ AGREGAR max_por_solicitud SOLO SI NO ES UNDEFINED
              ...(licenseType.max_por_solicitud !== undefined && { max_por_solicitud: licenseType.max_por_solicitud }),
              // ✅ AGREGAR max_acumulacion SOLO SI NO ES UNDEFINED
              ...(licenseType.max_acumulacion !== undefined && { max_acumulacion: licenseType.max_acumulacion }),
            };
            
            batch.update(docRef, updateData);
            
            // ✅ LOG ESPECÍFICO PARA LG08
            if (isLG08) {
              console.log(`🍼 LG08 - ACTUALIZACIÓN FORZADA:`, {
                codigo: licenseType.codigo,
                unidad_control: licenseType.unidad_control,
                max_por_solicitud: licenseType.max_por_solicitud,
                categoria: licenseType.categoria,
                periodo_control: licenseType.periodo_control
              });
            } else {
              console.log(`🔄 Tipo de licencia actualizado: ${licenseType.codigo} - ${licenseType.nombre}`, updateData);
            }
          } else {
            console.log(`ℹ️ Tipo de licencia ya está actualizado: ${licenseType.codigo}`);
          }
        }
      }
      
      await batch.commit();
      console.log('🎉 Tipos de licencias inicializados/actualizados correctamente');
    } catch (error) {
      console.error('❌ Error inicializando tipos de licencias:', error);
      throw new Error('Error al inicializar tipos de licencias');
    }
  }

  // Obtener todos los tipos de licencias
  static async getAllLicenseTypes(): Promise<LicenseType[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.licenseTypesCollection));
      return querySnapshot.docs.map(doc => this.mapDocumentToLicenseType(doc));
    } catch (error) {
      console.error('Error getting license types:', error);
      throw new Error('Error al obtener tipos de licencias');
    }
  }

  // Obtener tipos de licencias activos
  static async getActiveLicenseTypes(): Promise<LicenseType[]> {
    try {
      // Consulta temporal sin ordenamiento mientras se construye el índice
      const q = query(
        collection(db, this.licenseTypesCollection),
        where('activo', '==', true)
      );
      const querySnapshot = await getDocs(q);
      const licenseTypes = querySnapshot.docs.map(doc => this.mapDocumentToLicenseType(doc));
      
      // Ordenar en el cliente mientras se construye el índice
      return licenseTypes.sort((a, b) => {
        if (a.categoria !== b.categoria) {
          return a.categoria.localeCompare(b.categoria);
        }
        return a.nombre.localeCompare(b.nombre);
      });
    } catch (error) {
      console.error('Error getting active license types:', error);
      throw new Error('Error al obtener tipos de licencias activos');
    }
  }

  // Obtener tipos de licencias por categoría
  static async getLicenseTypesByCategory(categoria: 'HORAS' | 'DIAS' | 'OCASION'): Promise<LicenseType[]> {
    try {
      const q = query(
        collection(db, this.licenseTypesCollection),
        where('categoria', '==', categoria),
        where('activo', '==', true),
        orderBy('nombre')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.mapDocumentToLicenseType(doc));
    } catch (error) {
      console.error('Error getting license types by category:', error);
      throw new Error('Error al obtener tipos de licencias por categoría');
    }
  }

  // Obtener tipo de licencia por código
  static async getLicenseTypeByCode(codigo: string): Promise<LicenseType | null> {
    try {
      const q = query(
        collection(db, this.licenseTypesCollection),
        where('codigo', '==', codigo)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      return this.mapDocumentToLicenseType(querySnapshot.docs[0]);
    } catch (error) {
      console.error('Error getting license type by code:', error);
      throw new Error('Error al obtener tipo de licencia');
    }
  }

  // Obtener cantidad disponible para un tipo de licencia
  static async getAvailableQuantity(employeeId: string, licenseTypeCode: string): Promise<number> {
    try {
      console.log(`🔍 DEBUG getAvailableQuantity: ${licenseTypeCode} para empleado ${employeeId}`);

      const employee = await this.getEmployeeById(employeeId);
      if (!employee?.disponibilidad) {
        console.log(`❌ DEBUG: Empleado sin disponibilidad`);
        return 0;
      }

      // ✅ VERIFICACIÓN DE SERVICIO PROFESIONAL
      // Los empleados de servicio profesional solo pueden usar OM14 y CT15
      if (employee.isProfessionalService) {
        const allowedLicenses = ['OM14', 'CT15'];
        if (!allowedLicenses.includes(licenseTypeCode)) {
          console.log(`🚫 DEBUG: Empleado de servicio profesional - ${licenseTypeCode} no disponible`);
          return 0; // No disponible para empleados de servicio profesional
        }
      }

      const licenseType = await this.getLicenseTypeByCode(licenseTypeCode);
      if (!licenseType) {
        console.log(`❌ DEBUG: Tipo de licencia no encontrado`);
        return 0;
      }

      console.log(`🔍 DEBUG: Tipo de licencia encontrado:`, {
        codigo: licenseType.codigo,
        categoria: licenseType.categoria,
        periodo_control: licenseType.periodo_control,
        max_por_solicitud: licenseType.max_por_solicitud,
        isProfessionalService: employee.isProfessionalService
      });

      switch (licenseType.categoria) {
                 case 'HORAS': {
           const horaLicencia = employee.disponibilidad?.licencias_horas?.[licenseTypeCode];
           // ✅ CONVERTIR A NÚMERO PARA ASEGURAR CÁLCULOS CORRECTOS
           const disponible = typeof horaLicencia?.disponible_anual === 'string' 
             ? parseFloat(horaLicencia.disponible_anual) 
             : (horaLicencia?.disponible_anual || 0);
           console.log(`🔍 DEBUG HORAS: ${disponible}`);
           return disponible;
         }
        
                 case 'DIAS': {
           const diaLicencia = employee.disponibilidad?.licencias_dias?.[licenseTypeCode];
           console.log(`🔍 DEBUG DIAS: periodo_control = ${licenseType.periodo_control}`);

                       if (licenseType.periodo_control === 'anual') {
              // ✅ MANEJO ESPECIAL PARA VGA12 (VACACIONES ACUMULATIVAS)
              if (licenseTypeCode === 'VGA12') {
                // Para VGA12, la disponibilidad incluye los días asignados + acumulados
                const disponible = typeof diaLicencia?.disponible_anual === 'string'
                  ? parseFloat(diaLicencia.disponible_anual)
                  : (diaLicencia?.disponible_anual || 0);

                console.log('🔍 DEBUG VGA12 DISPONIBILIDAD:', {
                  disponible_anual: diaLicencia?.disponible_anual,
                  acumulado_total: diaLicencia?.acumulado_total,
                  max_acumulacion: diaLicencia?.max_acumulacion,
                  disponible_calculada: disponible,
                  utilizada_anual: diaLicencia?.utilizada_anual,
                  asignada_anual: diaLicencia?.asignada_anual
                });

                console.log(`🔍 DEBUG VGA12: ${disponible}`);
                return disponible;
              } else {
                // ✅ CONVERTIR A NÚMERO PARA ASEGURAR CÁLCULOS CORRECTOS
                const disponible = typeof diaLicencia?.disponible_anual === 'string'
                  ? parseFloat(diaLicencia.disponible_anual)
                  : (diaLicencia?.disponible_anual || 0);

                // ✅ DEBUG ESPECÍFICO PARA VG11
                if (licenseTypeCode === 'VG11') {
                  console.log('🔍 DEBUG VG11 DISPONIBILIDAD:', {
                    disponible_anual: diaLicencia?.disponible_anual,
                    tipo: typeof diaLicencia?.disponible_anual,
                    disponible_calculada: disponible,
                    utilizada_anual: diaLicencia?.utilizada_anual,
                    asignada_anual: diaLicencia?.asignada_anual
                  });
                }

                console.log(`🔍 DEBUG DIAS ANUAL: ${disponible}`);
                return disponible;
              }
           } else if (licenseType.periodo_control === 'mensual') {
             // ✅ CONVERTIR A NÚMERO PARA ASEGURAR CÁLCULOS CORRECTOS
             const disponible = typeof diaLicencia?.disponible_mes_actual === 'string' 
               ? parseFloat(diaLicencia.disponible_mes_actual) 
               : (diaLicencia?.disponible_mes_actual || 0);
             console.log(`🔍 DEBUG DIAS MENSUAL: ${disponible}`);
             return disponible;
           } else if (licenseType.periodo_control === 'ninguno') {
             // Para permisos por evento (como maternidad), retornar max_por_solicitud o un valor alto
             const disponible = licenseType.max_por_solicitud || 999;
             console.log(`🔍 DEBUG DIAS NINGUNO: max_por_solicitud = ${licenseType.max_por_solicitud}, retornando ${disponible}`);
             return disponible;
           }
           console.log(`🔍 DEBUG DIAS DEFAULT: 0`);
           return 0;
         }
        
        case 'OCASION': {
          const employee = await this.getEmployeeById(employeeId);
          const disponibilidad = employee?.disponibilidad;
          const ocasionLicencia = disponibilidad?.licencias_ocasion?.[licenseTypeCode];
          
          // ✅ NUEVO: Manejo especial para OM14 y CT15 (control mensual)
          if (licenseType.periodo_control === 'mensual' && ocasionLicencia) {
            const disponible = typeof ocasionLicencia.disponible_mes_actual === 'string' 
              ? parseFloat(ocasionLicencia.disponible_mes_actual) 
              : (ocasionLicencia.disponible_mes_actual || 0);
            console.log(`🔍 DEBUG OCASION MENSUAL (${licenseTypeCode}): disponible_mes_actual = ${disponible}`);
            return disponible;
          } else {
            // Para otros tipos de OCASIÓN, usar max_por_solicitud
            const disponible = licenseType.max_por_solicitud || 999;
            console.log(`🔍 DEBUG OCASION NINGUNO: max_por_solicitud = ${licenseType.max_por_solicitud}, retornando ${disponible}`);
            return disponible;
          }
        }
        
        default:
          console.log(`🔍 DEBUG DEFAULT: 0`);
          return 0;
      }
    } catch (error) {
      console.error('Error getting available quantity:', error);
      return 0;
    }
  }

    // Restaurar disponibilidad del empleado (inverso de updateEmployeeAvailability)
  static async restoreEmployeeAvailability(employeeId: string, licenseTypeCode: string, quantity: number, startDate?: Date): Promise<void> {
    try {
      const employee = await this.getEmployeeById(employeeId);
      if (!employee?.disponibilidad) return;

      const licenseType = await this.getLicenseTypeByCode(licenseTypeCode);
      if (!licenseType) return;

      const disponibilidad = { ...employee.disponibilidad };

      switch (licenseType.categoria) {
        case 'HORAS': {
          const horaLicencia = disponibilidad.licencias_horas?.[licenseTypeCode];
          if (horaLicencia) {
            // ✅ Restaurar disponibilidad para permisos anuales
            if (startDate) {
              const permisoYear = startDate.getFullYear();
              const currentYear = getCurrentDateInElSalvador().getFullYear();
              
              // Si el permiso es de un año anterior, restaurar el historial de ese año
              if (permisoYear < currentYear) {
                if (horaLicencia.uso_anual) {
                  const yearKey = permisoYear.toString();
                  if (horaLicencia.uso_anual[yearKey]) {
                    horaLicencia.uso_anual[yearKey].utilizada -= quantity;
                    horaLicencia.uso_anual[yearKey].disponible += quantity;
                    console.log(`✅ Disponibilidad anual restaurada para ${yearKey}: ${quantity} horas`);
                  }
                }
                             } else {
                 // Si es del año actual, restaurar disponibilidad actual
                 // ✅ CONVERTIR A NÚMEROS PARA ASEGURAR CÁLCULOS CORRECTOS
                 const utilizadaActual = typeof horaLicencia.utilizada_anual === 'string' 
                   ? parseFloat(horaLicencia.utilizada_anual) 
                   : (horaLicencia.utilizada_anual || 0);
                 const disponibleActual = typeof horaLicencia.disponible_anual === 'string' 
                   ? parseFloat(horaLicencia.disponible_anual) 
                   : (horaLicencia.disponible_anual || 0);
                 
                 horaLicencia.utilizada_anual = utilizadaActual - quantity;
                 horaLicencia.disponible_anual = disponibleActual + quantity;
                 
                 console.log('✅ RESTAURACIÓN CORREGIDA HORAS:', {
                   utilizadaAnterior: utilizadaActual,
                   disponibleAnterior: disponibleActual,
                   cantidadRestaurada: quantity,
                   utilizadaNueva: horaLicencia.utilizada_anual,
                   disponibleNueva: horaLicencia.disponible_anual
                 });
               }
                         } else {
               // Si no hay fecha de inicio, restaurar año actual
               // ✅ CONVERTIR A NÚMEROS PARA ASEGURAR CÁLCULOS CORRECTOS
               const utilizadaActual = typeof horaLicencia.utilizada_anual === 'string' 
                 ? parseFloat(horaLicencia.utilizada_anual) 
                 : (horaLicencia.utilizada_anual || 0);
               const disponibleActual = typeof horaLicencia.disponible_anual === 'string' 
                 ? parseFloat(horaLicencia.disponible_anual) 
                 : (horaLicencia.disponible_anual || 0);
               
               horaLicencia.utilizada_anual = utilizadaActual - quantity;
               horaLicencia.disponible_anual = disponibleActual + quantity;
               
               console.log('✅ RESTAURACIÓN CORREGIDA HORAS (sin fecha):', {
                 utilizadaAnterior: utilizadaActual,
                 disponibleAnterior: disponibleActual,
                 cantidadRestaurada: quantity,
                 utilizadaNueva: horaLicencia.utilizada_anual,
                 disponibleNueva: horaLicencia.disponible_anual
               });
             }
            horaLicencia.ultima_actualizacion = getCurrentDateInElSalvador();
          }
          break;
        }

        case 'DIAS': {
          const diaLicencia = disponibilidad.licencias_dias?.[licenseTypeCode];
          if (diaLicencia) {
            if (licenseType.periodo_control === 'anual') {
              // ✅ MANEJO ESPECIAL PARA VGA12 (VACACIONES ACUMULATIVAS)
              if (licenseTypeCode === 'VGA12') {
                // Para VGA12, solo restaurar contadores anuales, el acumulado permanece
                // ✅ CONVERTIR A NÚMEROS PARA ASEGURAR CÁLCULOS CORRECTOS
                const utilizadaActual = typeof diaLicencia.utilizada_anual === 'string'
                  ? parseFloat(diaLicencia.utilizada_anual)
                  : (diaLicencia.utilizada_anual || 0);
                const disponibleActual = typeof diaLicencia.disponible_anual === 'string'
                  ? parseFloat(diaLicencia.disponible_anual)
                  : (diaLicencia.disponible_anual || 0);

                diaLicencia.utilizada_anual = utilizadaActual - quantity;
                diaLicencia.disponible_anual = disponibleActual + quantity;

                console.log('✅ VGA12 RESTAURADO:', {
                  utilizadaAnterior: utilizadaActual,
                  disponibleAnterior: disponibleActual,
                  cantidadRestaurada: quantity,
                  acumulado_total: diaLicencia.acumulado_total,
                  utilizadaNueva: diaLicencia.utilizada_anual,
                  disponibleNueva: diaLicencia.disponible_anual
                });
              } else {
                // ✅ Restaurar disponibilidad para permisos anuales
                if (startDate) {
                  const permisoYear = startDate.getFullYear();
                  const currentYear = getCurrentDateInElSalvador().getFullYear();

                  // Si el permiso es de un año anterior, restaurar el historial de ese año
                  if (permisoYear < currentYear) {
                    if (diaLicencia.uso_anual) {
                      const yearKey = permisoYear.toString();
                      if (diaLicencia.uso_anual[yearKey]) {
                        diaLicencia.uso_anual[yearKey].utilizada -= quantity;
                        diaLicencia.uso_anual[yearKey].disponible += quantity;
                        console.log(`✅ Disponibilidad anual restaurada para ${yearKey}: ${quantity} días`);
                      }
                    }
                  } else {
                    // Si es del año actual, restaurar disponibilidad actual
                    // ✅ CONVERTIR A NÚMEROS PARA ASEGURAR CÁLCULOS CORRECTOS
                    const utilizadaActual = typeof diaLicencia.utilizada_anual === 'string'
                      ? parseFloat(diaLicencia.utilizada_anual)
                      : (diaLicencia.utilizada_anual || 0);
                    const disponibleActual = typeof diaLicencia.disponible_anual === 'string'
                      ? parseFloat(diaLicencia.disponible_anual)
                      : (diaLicencia.disponible_anual || 0);

                    diaLicencia.utilizada_anual = utilizadaActual - quantity;
                    diaLicencia.disponible_anual = disponibleActual + quantity;

                    console.log('✅ RESTAURACIÓN CORREGIDA DIAS:', {
                      utilizadaAnterior: utilizadaActual,
                      disponibleAnterior: disponibleActual,
                      cantidadRestaurada: quantity,
                      utilizadaNueva: diaLicencia.utilizada_anual,
                      disponibleNueva: diaLicencia.disponible_anual
                    });
                  }
                } else {
                  // Si no hay fecha de inicio, restaurar año actual
                  // ✅ CONVERTIR A NÚMEROS PARA ASEGURAR CÁLCULOS CORRECTOS
                  const utilizadaActual = typeof diaLicencia.utilizada_anual === 'string'
                    ? parseFloat(diaLicencia.utilizada_anual)
                    : (diaLicencia.utilizada_anual || 0);
                  const disponibleActual = typeof diaLicencia.disponible_anual === 'string'
                    ? parseFloat(diaLicencia.disponible_anual)
                    : (diaLicencia.disponible_anual || 0);

                  diaLicencia.utilizada_anual = utilizadaActual - quantity;
                  diaLicencia.disponible_anual = disponibleActual + quantity;

                  console.log('✅ RESTAURACIÓN CORREGIDA DIAS (sin fecha):', {
                    utilizadaAnterior: utilizadaActual,
                    disponibleAnterior: disponibleActual,
                    cantidadRestaurada: quantity,
                    utilizadaNueva: diaLicencia.utilizada_anual,
                    disponibleNueva: diaLicencia.disponible_anual
                  });
                }
              }
            } else if (licenseType.periodo_control === 'mensual') {
              // ✅ CONVERTIR A NÚMEROS PARA ASEGURAR CÁLCULOS CORRECTOS
              const utilizadaMensual = typeof diaLicencia.utilizada_mes_actual === 'string' 
                ? parseFloat(diaLicencia.utilizada_mes_actual) 
                : (diaLicencia.utilizada_mes_actual || 0);
              const disponibleMensual = typeof diaLicencia.disponible_mes_actual === 'string' 
                ? parseFloat(diaLicencia.disponible_mes_actual) 
                : (diaLicencia.disponible_mes_actual || 0);
              
              diaLicencia.utilizada_mes_actual = utilizadaMensual - quantity;
              diaLicencia.disponible_mes_actual = disponibleMensual + quantity;
              
              console.log('✅ RESTAURACIÓN CORREGIDA DIAS MENSUAL:', {
                utilizadaAnterior: utilizadaMensual,
                disponibleAnterior: disponibleMensual,
                cantidadRestaurada: quantity,
                utilizadaNueva: diaLicencia.utilizada_mes_actual,
                disponibleNueva: diaLicencia.disponible_mes_actual
              });
            }
            diaLicencia.ultima_actualizacion = getCurrentDateInElSalvador();
          }
          break;
        }

        case 'OCASION': {
          const ocasionLicencia = disponibilidad.licencias_ocasion?.[licenseTypeCode];
          if (ocasionLicencia) {
            // ✅ NUEVO: Manejo especial para OM14 y CT15 (control mensual) retroactivo
            if ((licenseTypeCode === 'OM14' || licenseTypeCode === 'CT15') && startDate) {
              const cambioMonth = startDate.getMonth() + 1;
              const cambioYear = startDate.getFullYear();
              const currentMonth = getCurrentDateInElSalvador().getMonth() + 1;
              const currentYear = getCurrentDateInElSalvador().getFullYear();
              
              // Si el cambio es de un mes anterior, restaurar el historial de ese mes
              if (cambioYear < currentYear || (cambioYear === currentYear && cambioMonth < currentMonth)) {
                const monthKey = `${cambioYear}-${cambioMonth.toString().padStart(2, '0')}`;
                
                if (ocasionLicencia.uso_mensual && ocasionLicencia.uso_mensual[monthKey]) {
                  ocasionLicencia.uso_mensual[monthKey].utilizada -= quantity;
                  ocasionLicencia.uso_mensual[monthKey].disponible += quantity;
                  console.log(`✅ ${licenseTypeCode} restaurado para ${monthKey}: ${quantity} ${licenseTypeCode === 'OM14' ? 'olvido(s)' : 'cambio(s)'}`);
                }
              } else {
                // Si es del mes actual, restaurar disponibilidad actual
                ocasionLicencia.utilizada_mes_actual = (ocasionLicencia.utilizada_mes_actual || 0) - quantity;
                ocasionLicencia.disponible_mes_actual = (ocasionLicencia.disponible_mes_actual || (licenseTypeCode === 'OM14' ? 2 : 3)) + quantity;
              }
            } else {
              // Para otros tipos de OCASIÓN, restaurar contadores anuales y historial
              ocasionLicencia.total_dias_año = (ocasionLicencia.total_dias_año || 0) - quantity;
              ocasionLicencia.total_solicitudes_año = (ocasionLicencia.total_solicitudes_año || 0) - 1;
              
              // ✅ NUEVO: Remover la entrada más reciente del historial
              if (ocasionLicencia.historial_uso && ocasionLicencia.historial_uso.length > 0) {
                ocasionLicencia.historial_uso.pop(); // Remover la última entrada
                console.log(`✅ Entrada removida del historial para ${licenseTypeCode}`);
              }
            }
            
            ocasionLicencia.ultima_actualizacion = getCurrentDateInElSalvador();
          }
          break;
        }
      }

      // Actualizar empleado
      const employeeRef = doc(db, this.employeesCollection, employeeId);
      await updateDoc(employeeRef, {
        disponibilidad: this.removeUndefinedValues(disponibilidad),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error restoring employee availability:', error);
      throw error;
    }
  }

  // Actualizar disponibilidad del empleado después de crear una solicitud
  static async updateEmployeeAvailability(employeeId: string, licenseTypeCode: string, quantity: number, startDate?: Date): Promise<void> {
    try {
      console.log('🔄 INICIANDO updateEmployeeAvailability:', {
        employeeId,
        licenseTypeCode,
        quantity,
        startDate
      });
      
      const employee = await this.getEmployeeById(employeeId);
      if (!employee?.disponibilidad) {
        console.log('❌ Empleado o disponibilidad no encontrada');
        return;
      }

      const licenseType = await this.getLicenseTypeByCode(licenseTypeCode);
      if (!licenseType) {
        console.log('❌ Tipo de licencia no encontrado');
        return;
      }

      console.log('✅ Datos obtenidos:', {
        employee: employee.id,
        licenseType: licenseType.codigo,
        categoria: licenseType.categoria,
        disponibilidad: !!employee.disponibilidad
      });

      const disponibilidad = { ...employee.disponibilidad };

      switch (licenseType.categoria) {
        case 'HORAS': {
          const horaLicencia = disponibilidad.licencias_horas?.[licenseTypeCode];
          if (horaLicencia) {
            console.log('✅ LICENCIA HORAS ENCONTRADA:', {
              utilizada_anual: horaLicencia.utilizada_anual,
              disponible_anual: horaLicencia.disponible_anual,
              asignada_anual: horaLicencia.asignada_anual
            });
            
            // ✅ NUEVO: Manejo especial para permisos anuales retroactivos
            if (startDate) {
              const permisoYear = startDate.getFullYear();
              const currentYear = getCurrentDateInElSalvador().getFullYear();
              
              // Si el permiso es de un año anterior, actualizar el historial de ese año
              if (permisoYear < currentYear) {
                // Inicializar historial anual si no existe
                if (!horaLicencia.uso_anual) {
                  horaLicencia.uso_anual = {};
                }
                
                const yearKey = permisoYear.toString();
                
                // Actualizar el año del permiso
                if (!horaLicencia.uso_anual[yearKey]) {
                  horaLicencia.uso_anual[yearKey] = { 
                    utilizada: 0, 
                    disponible: horaLicencia.asignada_anual || 40,
                    asignada: horaLicencia.asignada_anual || 40 
                  };
                }
                
                horaLicencia.uso_anual[yearKey].utilizada += quantity;
                horaLicencia.uso_anual[yearKey].disponible -= quantity;
                
                console.log(`✅ Permiso anual retroactivo registrado para ${yearKey}: ${quantity} horas`);
                           } else {
               // Si es del año actual, afectar disponibilidad actual
               // ✅ CONVERTIR A NÚMEROS PARA ASEGURAR CÁLCULOS CORRECTOS
               const utilizadaActual = typeof horaLicencia.utilizada_anual === 'string' 
                 ? parseFloat(horaLicencia.utilizada_anual) 
                 : (horaLicencia.utilizada_anual || 0);
               const disponibleActual = typeof horaLicencia.disponible_anual === 'string' 
                 ? parseFloat(horaLicencia.disponible_anual) 
                 : (horaLicencia.disponible_anual || 0);
               
               horaLicencia.utilizada_anual = utilizadaActual + quantity;
               horaLicencia.disponible_anual = disponibleActual - quantity;
               
               console.log('✅ CÁLCULO CORREGIDO HORAS:', {
                 utilizadaAnterior: utilizadaActual,
                 disponibleAnterior: disponibleActual,
                 cantidadAgregada: quantity,
                 utilizadaNueva: horaLicencia.utilizada_anual,
                 disponibleNueva: horaLicencia.disponible_anual
               });
             }
                         } else {
               // Si no hay fecha de inicio, afectar año actual (comportamiento por defecto)
               // ✅ CONVERTIR A NÚMEROS PARA ASEGURAR CÁLCULOS CORRECTOS
               const utilizadaActual = typeof horaLicencia.utilizada_anual === 'string' 
                 ? parseFloat(horaLicencia.utilizada_anual) 
                 : (horaLicencia.utilizada_anual || 0);
               const disponibleActual = typeof horaLicencia.disponible_anual === 'string' 
                 ? parseFloat(horaLicencia.disponible_anual) 
                 : (horaLicencia.disponible_anual || 0);
               
               horaLicencia.utilizada_anual = utilizadaActual + quantity;
               horaLicencia.disponible_anual = disponibleActual - quantity;
               
               console.log('✅ CÁLCULO CORREGIDO HORAS (sin fecha):', {
                 utilizadaAnterior: utilizadaActual,
                 disponibleAnterior: disponibleActual,
                 cantidadAgregada: quantity,
                 utilizadaNueva: horaLicencia.utilizada_anual,
                 disponibleNueva: horaLicencia.disponible_anual
               });
             }
            horaLicencia.ultima_actualizacion = getCurrentDateInElSalvador();
            
            console.log('✅ DISPONIBILIDAD HORAS ACTUALIZADA:', {
              utilizada_anual: horaLicencia.utilizada_anual,
              disponible_anual: horaLicencia.disponible_anual,
              asignada_anual: horaLicencia.asignada_anual
            });
          } else {
            console.log('❌ LICENCIA HORAS NO ENCONTRADA:', {
              licenseTypeCode,
              disponibilidad: !!disponibilidad.licencias_horas
            });
          }
          break;
        }

        case 'DIAS': {
          const diaLicencia = disponibilidad.licencias_dias?.[licenseTypeCode];
          if (diaLicencia) {
            if (licenseType.periodo_control === 'anual') {
              // ✅ MANEJO ESPECIAL PARA VGA12 (VACACIONES ACUMULATIVAS)
              if (licenseTypeCode === 'VGA12') {
                // Para VGA12, solo actualizar contadores anuales, el acumulado permanece
                // ✅ CONVERTIR A NÚMEROS PARA ASEGURAR CÁLCULOS CORRECTOS
                const utilizadaActual = typeof diaLicencia.utilizada_anual === 'string'
                  ? parseFloat(diaLicencia.utilizada_anual)
                  : (diaLicencia.utilizada_anual || 0);
                const disponibleActual = typeof diaLicencia.disponible_anual === 'string'
                  ? parseFloat(diaLicencia.disponible_anual)
                  : (diaLicencia.disponible_anual || 0);

                diaLicencia.utilizada_anual = utilizadaActual + quantity;
                diaLicencia.disponible_anual = disponibleActual - quantity;

                console.log('✅ VGA12 ACTUALIZADO:', {
                  utilizadaAnterior: utilizadaActual,
                  disponibleAnterior: disponibleActual,
                  cantidadAgregada: quantity,
                  acumulado_total: diaLicencia.acumulado_total,
                  utilizadaNueva: diaLicencia.utilizada_anual,
                  disponibleNueva: diaLicencia.disponible_anual
                });
              } else {
                // ✅ NUEVO: Manejo especial para permisos anuales retroactivos
                if (startDate) {
                  const permisoYear = startDate.getFullYear();
                  const currentYear = getCurrentDateInElSalvador().getFullYear();

                  // Si el permiso es de un año anterior, actualizar el historial de ese año
                  if (permisoYear < currentYear) {
                    // Inicializar historial anual si no existe
                    if (!diaLicencia.uso_anual) {
                      diaLicencia.uso_anual = {};
                    }

                    const yearKey = permisoYear.toString();

                    // Actualizar el año del permiso
                    if (!diaLicencia.uso_anual[yearKey]) {
                      diaLicencia.uso_anual[yearKey] = {
                        utilizada: 0,
                        disponible: diaLicencia.asignada_anual || 15,
                        asignada: diaLicencia.asignada_anual || 15
                      };
                    }

                    diaLicencia.uso_anual[yearKey].utilizada += quantity;
                    diaLicencia.uso_anual[yearKey].disponible -= quantity;

                    console.log(`✅ Permiso anual retroactivo registrado para ${yearKey}: ${quantity} días`);
                  } else {
                    // Si es del año actual, afectar disponibilidad actual
                    // ✅ CONVERTIR A NÚMEROS PARA ASEGURAR CÁLCULOS CORRECTOS
                    const utilizadaActual = typeof diaLicencia.utilizada_anual === 'string'
                      ? parseFloat(diaLicencia.utilizada_anual)
                      : (diaLicencia.utilizada_anual || 0);
                    const disponibleActual = typeof diaLicencia.disponible_anual === 'string'
                      ? parseFloat(diaLicencia.disponible_anual)
                      : (diaLicencia.disponible_anual || 0);

                    diaLicencia.utilizada_anual = utilizadaActual + quantity;
                    diaLicencia.disponible_anual = disponibleActual - quantity;

                    console.log('✅ CÁLCULO CORREGIDO DIAS:', {
                      utilizadaAnterior: utilizadaActual,
                      disponibleAnterior: disponibleActual,
                      cantidadAgregada: quantity,
                      utilizadaNueva: diaLicencia.utilizada_anual,
                      disponibleNueva: diaLicencia.disponible_anual
                    });
                  }
                } else {
                  // Si no hay fecha de inicio, afectar año actual (comportamiento por defecto)
                  // ✅ CONVERTIR A NÚMEROS PARA ASEGURAR CÁLCULOS CORRECTOS
                  const utilizadaActual = typeof diaLicencia.utilizada_anual === 'string'
                    ? parseFloat(diaLicencia.utilizada_anual)
                    : (diaLicencia.utilizada_anual || 0);
                  const disponibleActual = typeof diaLicencia.disponible_anual === 'string'
                    ? parseFloat(diaLicencia.disponible_anual)
                    : (diaLicencia.disponible_anual || 0);

                  diaLicencia.utilizada_anual = utilizadaActual + quantity;
                  diaLicencia.disponible_anual = disponibleActual - quantity;

                  console.log('✅ CÁLCULO CORREGIDO DIAS (sin fecha):', {
                    utilizadaAnterior: utilizadaActual,
                    disponibleAnterior: disponibleActual,
                    cantidadAgregada: quantity,
                    utilizadaNueva: diaLicencia.utilizada_anual,
                    disponibleNueva: diaLicencia.disponible_anual
                  });
                }
              }
            } else if (licenseType.periodo_control === 'mensual') {
              // ✅ CONVERTIR A NÚMEROS PARA ASEGURAR CÁLCULOS CORRECTOS
              const utilizadaMensual = typeof diaLicencia.utilizada_mes_actual === 'string' 
                ? parseFloat(diaLicencia.utilizada_mes_actual) 
                : (diaLicencia.utilizada_mes_actual || 0);
              const disponibleMensual = typeof diaLicencia.disponible_mes_actual === 'string' 
                ? parseFloat(diaLicencia.disponible_mes_actual) 
                : (diaLicencia.disponible_mes_actual || 0);
              
              diaLicencia.utilizada_mes_actual = utilizadaMensual + quantity;
              diaLicencia.disponible_mes_actual = disponibleMensual - quantity;
              
              console.log('✅ CÁLCULO CORREGIDO DIAS MENSUAL:', {
                utilizadaAnterior: utilizadaMensual,
                disponibleAnterior: disponibleMensual,
                cantidadAgregada: quantity,
                utilizadaNueva: diaLicencia.utilizada_mes_actual,
                disponibleNueva: diaLicencia.disponible_mes_actual
              });
            }
            diaLicencia.ultima_actualizacion = getCurrentDateInElSalvador();
          }
          break;
        }

        case 'OCASION': {
          const ocasionLicencia = disponibilidad.licencias_ocasion?.[licenseTypeCode];
          if (ocasionLicencia) {
            // ✅ NUEVO: Manejo especial para OM14 y CT15 (control mensual) retroactivo
            if ((licenseTypeCode === 'OM14' || licenseTypeCode === 'CT15') && startDate) {
              const cambioMonth = startDate.getMonth() + 1;
              const cambioYear = startDate.getFullYear();
              const currentMonth = getCurrentDateInElSalvador().getMonth() + 1;
              const currentYear = getCurrentDateInElSalvador().getFullYear();
              
              // Si el cambio es de un mes anterior, actualizar el historial de ese mes
              if (cambioYear < currentYear || (cambioYear === currentYear && cambioMonth < currentMonth)) {
                const monthKey = `${cambioYear}-${cambioMonth.toString().padStart(2, '0')}`;
                
                // Inicializar historial mensual si no existe
                if (!ocasionLicencia.uso_mensual) {
                  ocasionLicencia.uso_mensual = {};
                }
                
                // Actualizar el mes del cambio
                const maxDisponible = licenseTypeCode === 'OM14' ? 2 : 3;
                if (!ocasionLicencia.uso_mensual[monthKey]) {
                  ocasionLicencia.uso_mensual[monthKey] = { utilizada: 0, disponible: maxDisponible };
                }
                
                ocasionLicencia.uso_mensual[monthKey].utilizada += quantity;
                ocasionLicencia.uso_mensual[monthKey].disponible -= quantity;
                
                console.log(`✅ ${licenseTypeCode} retroactivo registrado para ${monthKey}: ${quantity} ${licenseTypeCode === 'OM14' ? 'olvido(s)' : 'cambio(s)'}`);
              } else {
                // Si es del mes actual, afectar disponibilidad actual
                ocasionLicencia.utilizada_mes_actual = (ocasionLicencia.utilizada_mes_actual || 0) + quantity;
                ocasionLicencia.disponible_mes_actual = (ocasionLicencia.disponible_mes_actual || (licenseTypeCode === 'OM14' ? 2 : 3)) - quantity;
              }
            } else {
              // Para otros tipos de OCASIÓN, actualizar contadores anuales y historial
              ocasionLicencia.total_dias_año = (ocasionLicencia.total_dias_año || 0) + quantity;
              ocasionLicencia.total_solicitudes_año = (ocasionLicencia.total_solicitudes_año || 0) + 1;
              
              // ✅ NUEVO: Agregar al historial de uso para que aparezca en "Solicitudes Año"
              if (!ocasionLicencia.historial_uso) {
                ocasionLicencia.historial_uso = [];
              }
              
                             // Agregar entrada al historial
               ocasionLicencia.historial_uso.push({
                 solicitud_id: `temp_${Date.now()}`, // ID temporal para el historial
                 fecha_inicio: startDate ? startDate.toISOString().split('T')[0] : getCurrentDateInElSalvador().toISOString().split('T')[0],
                 fecha_fin: startDate ? startDate.toISOString().split('T')[0] : getCurrentDateInElSalvador().toISOString().split('T')[0], // Para MG07, usar la fecha de inicio como fin también
                 dias_utilizados: quantity,
                 motivo: 'Licencia creada',
                 estado: 'APROBADA'
               });
              
              console.log(`✅ Historial actualizado para ${licenseTypeCode}:`, {
                total_dias_año: ocasionLicencia.total_dias_año,
                total_solicitudes_año: ocasionLicencia.total_solicitudes_año,
                historial_length: ocasionLicencia.historial_uso.length
              });
            }
            
            ocasionLicencia.ultima_actualizacion = getCurrentDateInElSalvador();
          }
          break;
        }
      }

      // Actualizar empleado
      console.log('💾 GUARDANDO DISPONIBILIDAD EN FIREBASE:', {
        employeeId,
        disponibilidad: disponibilidad
      });
      
      const employeeRef = doc(db, this.employeesCollection, employeeId);
      await updateDoc(employeeRef, {
        disponibilidad: this.removeUndefinedValues(disponibilidad),
        updatedAt: serverTimestamp(),
      });
      
      console.log('✅ DISPONIBILIDAD GUARDADA EN FIREBASE');
    } catch (error) {
      console.error('Error updating employee availability:', error);
      throw error;
    }
  }

  // ========================================
  // GESTIÓN DE DISPONIBILIDAD DE EMPLEADOS
  // ========================================

  // Inicializar disponibilidad para un empleado
  static async initializeEmployeeAvailability(employeeId: string): Promise<void> {
    try {
      console.log(`🔄 Inicializando disponibilidad para empleado: ${employeeId}`);
      
      const employee = await this.getEmployeeById(employeeId);
      if (!employee) {
        throw new Error('Empleado no encontrado');
      }

      const licenseTypes = await this.getActiveLicenseTypes();
             const currentYear = getCurrentDateInElSalvador().getFullYear();
       const currentMonth = getCurrentDateInElSalvador().getMonth() + 1;

      // Crear estructura de disponibilidad
      const disponibilidad = {
        año_actual: currentYear,
        mes_actual: currentMonth,
                 ultima_renovacion_anual: getCurrentDateInElSalvador(),
         ultima_renovacion_mensual: getCurrentDateInElSalvador(),
        licencias_horas: {} as Record<string, LicenciaHora>,
        licencias_dias: {} as Record<string, LicenciaDia>,
        licencias_ocasion: {} as Record<string, LicenciaOcasion>,
      };

      // Inicializar cada tipo de licencia según categoría
      for (const licenseType of licenseTypes) {
        // Verificar elegibilidad por género
        if (licenseType.aplica_genero) {
          const employeeGender = employee.gender === 'male' ? 'M' : employee.gender === 'female' ? 'F' : 'M';
          if (employeeGender !== licenseType.aplica_genero) {
            continue; // Saltar si no es elegible
          }
        }

        switch (licenseType.categoria) {
                     case 'HORAS':
             disponibilidad.licencias_horas[licenseType.codigo] = {
               codigo: licenseType.codigo,
               nombre: licenseType.nombre,
               categoria: 'HORAS',
               periodo_control: licenseType.periodo_control,
               asignada_anual: licenseType.cantidad_maxima,
               utilizada_anual: 0,
               disponible_anual: licenseType.cantidad_maxima,
               asignada_actual: licenseType.cantidad_maxima,
               utilizada_actual: 0,
               disponible_actual: licenseType.cantidad_maxima,
               unidad: licenseType.unidad_control,
               ...(licenseType.aplica_genero && { aplica_genero: licenseType.aplica_genero }),
               periodo_activo: true,
               fecha_inicio_periodo: getCurrentDateInElSalvador(),
               fecha_fin_periodo: new Date(getCurrentDateInElSalvador().getFullYear(), 11, 31), // Fin de año
               solicitudes_activas: [],
               ultima_actualizacion: getCurrentDateInElSalvador(),
             };
            break;

                     case 'DIAS':
             // ✅ DEBUG: Log específico para VG11
             if (licenseType.codigo === 'VG11') {
               console.log('🔍 DEBUG VG11 INICIALIZACIÓN:', {
                 codigo: licenseType.codigo,
                 cantidad_maxima: licenseType.cantidad_maxima,
                 periodo_control: licenseType.periodo_control,
                 asignada_anual: licenseType.periodo_control === 'anual' ? licenseType.cantidad_maxima : 0
               });
             }
             
             // ✅ MANEJO ESPECIAL PARA VGA12 (VACACIONES ACUMULATIVAS)
            if (licenseType.codigo === 'VGA12') {
              disponibilidad.licencias_dias[licenseType.codigo] = {
                codigo: licenseType.codigo,
                nombre: licenseType.nombre,
                categoria: 'DIAS',
                periodo_control: licenseType.periodo_control,
                asignada_anual: licenseType.cantidad_maxima, // 15 días por año (acumulables)
                utilizada_anual: 0,
                disponible_anual: licenseType.cantidad_maxima, // 15 días disponibles inicialmente
                acumulado_total: 0, // Días acumulados de años anteriores
                max_acumulacion: licenseType.max_acumulacion || 90, // Máximo 90 días acumulados
                asignada_mensual: 0,
                utilizada_mes_actual: 0,
                disponible_mes_actual: 0,
                asignada_por_embarazo: 0,
                utilizada_embarazo_actual: 0,
                disponible_embarazo_actual: 0,
                unidad: licenseType.unidad_control,
                ...(licenseType.aplica_genero && { aplica_genero: licenseType.aplica_genero }),
                embarazo_activo: false,
                uso_mensual: {},
                solicitudes_activas: [],
                ultima_actualizacion: getCurrentDateInElSalvador(),
              };
            } else {
              disponibilidad.licencias_dias[licenseType.codigo] = {
                codigo: licenseType.codigo,
                nombre: licenseType.nombre,
                categoria: 'DIAS',
                periodo_control: licenseType.periodo_control,
                asignada_anual: licenseType.periodo_control === 'anual' ? licenseType.cantidad_maxima : 0,
                utilizada_anual: 0,
                disponible_anual: licenseType.periodo_control === 'anual' ? licenseType.cantidad_maxima : 0,
                asignada_mensual: licenseType.periodo_control === 'mensual' ? licenseType.cantidad_maxima : 0,
                utilizada_mes_actual: 0,
                disponible_mes_actual: licenseType.periodo_control === 'mensual' ? licenseType.cantidad_maxima : 0,
                asignada_por_embarazo: licenseType.codigo === 'MG07' ? licenseType.cantidad_maxima : 0,
                utilizada_embarazo_actual: 0,
                disponible_embarazo_actual: licenseType.codigo === 'MG07' ? licenseType.cantidad_maxima : 0,
                unidad: licenseType.unidad_control,
                ...(licenseType.aplica_genero && { aplica_genero: licenseType.aplica_genero }),
                embarazo_activo: false,
                uso_mensual: {},
                solicitudes_activas: [],
                ultima_actualizacion: getCurrentDateInElSalvador(),
              };
            }
            break;

          case 'OCASION':
            // ✅ NUEVO: Manejo especial para OM14 y CT15 (control mensual)
            if (licenseType.periodo_control === 'mensual') {
              disponibilidad.licencias_ocasion[licenseType.codigo] = {
                codigo: licenseType.codigo,
                nombre: licenseType.nombre,
                categoria: 'OCASION',
                periodo_control: 'mensual',
                asignada_mensual: licenseType.cantidad_maxima,
                max_por_solicitud: licenseType.max_por_solicitud,
                unidad: licenseType.unidad_control,
                utilizada_mes_actual: 0,
                disponible_mes_actual: licenseType.cantidad_maxima,
                uso_mensual: {},
                historial_uso: [],
                total_dias_año: 0,
                total_solicitudes_año: 0,
                solicitudes_activas: [],
                ultima_actualizacion: getCurrentDateInElSalvador(),
              };
            } else {
              disponibilidad.licencias_ocasion[licenseType.codigo] = {
                codigo: licenseType.codigo,
                nombre: licenseType.nombre,
                categoria: 'OCASION',
                periodo_control: 'ninguno',
                max_por_solicitud: licenseType.max_por_solicitud,
                unidad: licenseType.unidad_control,
                historial_uso: [],
                total_dias_año: 0,
                total_solicitudes_año: 0,
                solicitudes_activas: [],
                ultima_actualizacion: getCurrentDateInElSalvador(),
              };
            }
            break;
        }
      }

             // Limpiar valores undefined antes de enviar a Firestore
       const cleanDisponibilidad = this.removeUndefinedValues(disponibilidad);
       
       // Actualizar empleado con disponibilidad
       const employeeRef = doc(db, this.employeesCollection, employeeId);
       await updateDoc(employeeRef, {
         disponibilidad: cleanDisponibilidad,
         updatedAt: serverTimestamp(),
       });

      console.log(`✅ Disponibilidad inicializada para empleado: ${employeeId}`);
    } catch (error) {
      console.error('❌ Error inicializando disponibilidad:', error);
      throw new Error('Error al inicializar disponibilidad del empleado');
    }
  }

  // Obtener disponibilidad de un empleado
  static async getEmployeeAvailability(employeeId: string): Promise<Employee['disponibilidad'] | null> {
    try {
      const employee = await this.getEmployeeById(employeeId);
      return employee?.disponibilidad || null;
    } catch (error) {
      console.error('Error getting employee availability:', error);
      throw new Error('Error al obtener disponibilidad del empleado');
    }
  }

  // Limpiar disponibilidad corrupta de VG11
  static async cleanVG11Availability(employeeId: string): Promise<void> {
    try {
      console.log(`🧹 Limpiando disponibilidad corrupta de VG11 para empleado: ${employeeId}`);
      
      const employee = await this.getEmployeeById(employeeId);
      if (!employee?.disponibilidad) {
        console.log('❌ Empleado sin disponibilidad, inicializando...');
        await this.initializeEmployeeAvailability(employeeId);
        return;
      }

      const disponibilidad = { ...employee.disponibilidad };
      
      // Limpiar específicamente VG11
      if (disponibilidad.licencias_dias?.VG11) {
        console.log('🔍 VG11 ANTES DE LIMPIEZA:', {
          asignada_anual: disponibilidad.licencias_dias.VG11.asignada_anual,
          utilizada_anual: disponibilidad.licencias_dias.VG11.utilizada_anual,
          disponible_anual: disponibilidad.licencias_dias.VG11.disponible_anual
        });
        
        // Corregir valores de VG11
        disponibilidad.licencias_dias.VG11.asignada_anual = 15;
        disponibilidad.licencias_dias.VG11.utilizada_anual = 0;
        disponibilidad.licencias_dias.VG11.disponible_anual = 15;
        disponibilidad.licencias_dias.VG11.ultima_actualizacion = getCurrentDateInElSalvador();
        
        console.log('✅ VG11 DESPUÉS DE LIMPIEZA:', {
          asignada_anual: disponibilidad.licencias_dias.VG11.asignada_anual,
          utilizada_anual: disponibilidad.licencias_dias.VG11.utilizada_anual,
          disponible_anual: disponibilidad.licencias_dias.VG11.disponible_anual
        });
      }

      // Actualizar empleado
      const employeeRef = doc(db, this.employeesCollection, employeeId);
      await updateDoc(employeeRef, {
        disponibilidad: this.removeUndefinedValues(disponibilidad),
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ Disponibilidad de VG11 limpiada para empleado: ${employeeId}`);
    } catch (error) {
      console.error('❌ Error limpiando disponibilidad de VG11:', error);
      throw new Error('Error al limpiar disponibilidad de VG11');
    }
  }

  // Resetear disponibilidad mensual para todos los empleados
  static async resetAllMonthlyAvailability(): Promise<{ success: number; failed: number }> {
    try {
      console.log('🔄 Iniciando reset mensual masivo de disponibilidad...');

      const employeesSnapshot = await getDocs(collection(db, this.employeesCollection));
      console.log(`📋 Encontrados ${employeesSnapshot.size} empleados para reset mensual`);

      let success = 0;
      let failed = 0;

      // Procesar empleados individualmente para mejor control de errores
      for (const employeeDoc of employeesSnapshot.docs) {
        try {
          const employeeId = employeeDoc.id;
          console.log(`🔄 Procesando reset mensual para empleado: ${employeeId}`);

          await this.renewMonthlyAvailability(employeeId);
          success++;
          console.log(`✅ Reset mensual completado para empleado: ${employeeId}`);
        } catch (error) {
          console.error(`❌ Error en reset mensual para empleado ${employeeDoc.id}:`, error);
          failed++;
        }
      }

      console.log(`📊 Reset mensual masivo completado: ${success} exitosos, ${failed} fallidos`);
      return { success, failed };

    } catch (error) {
      console.error('❌ Error general en reset mensual masivo:', error);
      throw new Error('Error al resetear disponibilidad mensual masiva');
    }
  }

  // Resetear disponibilidad anual para todos los empleados
  static async resetAllAnnualAvailability(): Promise<{ success: number; failed: number }> {
    try {
      console.log('🔄 Iniciando reset anual masivo de disponibilidad...');

      const employeesSnapshot = await getDocs(collection(db, this.employeesCollection));
      console.log(`📋 Encontrados ${employeesSnapshot.size} empleados para reset anual`);

      let success = 0;
      let failed = 0;

      // Procesar empleados individualmente para mejor control de errores
      for (const employeeDoc of employeesSnapshot.docs) {
        try {
          const employeeId = employeeDoc.id;
          console.log(`🔄 Procesando reset anual para empleado: ${employeeId}`);

          await this.renewAnnualAvailability(employeeId);
          success++;
          console.log(`✅ Reset anual completado para empleado: ${employeeId}`);
        } catch (error) {
          console.error(`❌ Error en reset anual para empleado ${employeeDoc.id}:`, error);
          failed++;
        }
      }

      console.log(`📊 Reset anual masivo completado: ${success} exitosos, ${failed} fallidos`);
      return { success, failed };

    } catch (error) {
      console.error('❌ Error general en reset anual masivo:', error);
      throw new Error('Error al resetear disponibilidad anual masiva');
    }
  }

  // Limpiar e inicializar disponibilidad de OM14 y CT15
  static async cleanMonthlyOcasionAvailability(employeeId: string): Promise<void> {
    try {
      console.log(`🧹 Limpiando disponibilidad mensual de OM14 y CT15 para empleado: ${employeeId}`);
      
      const employee = await this.getEmployeeById(employeeId);
      if (!employee?.disponibilidad) {
        console.log('❌ Empleado sin disponibilidad, inicializando...');
        await this.initializeEmployeeAvailability(employeeId);
        return;
      }

      const disponibilidad = { ...employee.disponibilidad };
      
      // Limpiar OM14 (Olvido de Marcación)
      if (disponibilidad.licencias_ocasion?.OM14) {
        console.log('🔍 OM14 ANTES DE LIMPIEZA:', {
          asignada_mensual: disponibilidad.licencias_ocasion.OM14.asignada_mensual,
          utilizada_mes_actual: disponibilidad.licencias_ocasion.OM14.utilizada_mes_actual,
          disponible_mes_actual: disponibilidad.licencias_ocasion.OM14.disponible_mes_actual
        });
        
        // Corregir valores de OM14
        disponibilidad.licencias_ocasion.OM14.periodo_control = 'mensual';
        disponibilidad.licencias_ocasion.OM14.asignada_mensual = 2;
        disponibilidad.licencias_ocasion.OM14.utilizada_mes_actual = 0;
        disponibilidad.licencias_ocasion.OM14.disponible_mes_actual = 2;
        disponibilidad.licencias_ocasion.OM14.max_por_solicitud = 1;
        disponibilidad.licencias_ocasion.OM14.unidad = 'olvidos';
        disponibilidad.licencias_ocasion.OM14.ultima_actualizacion = getCurrentDateInElSalvador();
        
        console.log('✅ OM14 DESPUÉS DE LIMPIEZA:', {
          asignada_mensual: disponibilidad.licencias_ocasion.OM14.asignada_mensual,
          utilizada_mes_actual: disponibilidad.licencias_ocasion.OM14.utilizada_mes_actual,
          disponible_mes_actual: disponibilidad.licencias_ocasion.OM14.disponible_mes_actual
        });
      }

      // Limpiar CT15 (Cambio de Turno)
      if (disponibilidad.licencias_ocasion?.CT15) {
        console.log('🔍 CT15 ANTES DE LIMPIEZA:', {
          asignada_mensual: disponibilidad.licencias_ocasion.CT15.asignada_mensual,
          utilizada_mes_actual: disponibilidad.licencias_ocasion.CT15.utilizada_mes_actual,
          disponible_mes_actual: disponibilidad.licencias_ocasion.CT15.disponible_mes_actual
        });
        
        // Corregir valores de CT15
        disponibilidad.licencias_ocasion.CT15.periodo_control = 'mensual';
        disponibilidad.licencias_ocasion.CT15.asignada_mensual = 3;
        disponibilidad.licencias_ocasion.CT15.utilizada_mes_actual = 0;
        disponibilidad.licencias_ocasion.CT15.disponible_mes_actual = 3;
        disponibilidad.licencias_ocasion.CT15.max_por_solicitud = 1;
        disponibilidad.licencias_ocasion.CT15.unidad = 'cambios';
        disponibilidad.licencias_ocasion.CT15.ultima_actualizacion = getCurrentDateInElSalvador();
        
        console.log('✅ CT15 DESPUÉS DE LIMPIEZA:', {
          asignada_mensual: disponibilidad.licencias_ocasion.CT15.asignada_mensual,
          utilizada_mes_actual: disponibilidad.licencias_ocasion.CT15.utilizada_mes_actual,
          disponible_mes_actual: disponibilidad.licencias_ocasion.CT15.disponible_mes_actual
        });
      }

      // Actualizar empleado
      const employeeRef = doc(db, this.employeesCollection, employeeId);
      await updateDoc(employeeRef, {
        disponibilidad: this.removeUndefinedValues(disponibilidad),
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ Disponibilidad mensual de OM14 y CT15 limpiada para empleado: ${employeeId}`);
    } catch (error) {
      console.error('❌ Error limpiando disponibilidad mensual:', error);
      throw new Error('Error al limpiar disponibilidad mensual');
    }
  }

  // Renovar disponibilidad anual
  static async renewAnnualAvailability(employeeId: string): Promise<void> {
    try {
      console.log(`🔄 Renovando disponibilidad anual para empleado: ${employeeId}`);
      console.log(`🔐 Usuario actual: ${auth.currentUser?.uid || 'No autenticado'}`);

      const employee = await this.getEmployeeById(employeeId);
      if (!employee?.disponibilidad) {
        console.log(`❌ Empleado ${employeeId} no encontrado o sin disponibilidad`);
        throw new Error('Empleado o disponibilidad no encontrada');
      }

             const licenseTypes = await this.getActiveLicenseTypes();
       const currentYear = getCurrentDateInElSalvador().getFullYear();
      const disponibilidad = { ...employee.disponibilidad };

      // Renovar licencias anuales
      for (const licenseType of licenseTypes) {
        if (licenseType.periodo_control === 'anual') {
          switch (licenseType.categoria) {
            case 'HORAS':
              if (disponibilidad.licencias_horas[licenseType.codigo]) {
                disponibilidad.licencias_horas[licenseType.codigo].asignada_anual = licenseType.cantidad_maxima;
                disponibilidad.licencias_horas[licenseType.codigo].utilizada_anual = 0;
                disponibilidad.licencias_horas[licenseType.codigo].disponible_anual = licenseType.cantidad_maxima;
                disponibilidad.licencias_horas[licenseType.codigo].ultima_actualizacion = new Date();
              }
              break;

            case 'DIAS':
              if (disponibilidad.licencias_dias[licenseType.codigo]) {
                // ✅ MANEJO ESPECIAL PARA VGA12 (VACACIONES ACUMULATIVAS)
                if (licenseType.codigo === 'VGA12') {
                  const vga12 = disponibilidad.licencias_dias[licenseType.codigo];

                  // Calcular días no utilizados del año anterior
                  const diasNoUtilizados = vga12.disponible_anual;
                  const maxAcumulacion = licenseType.max_acumulacion || 90;

                  // Acumular días no utilizados (respetando el máximo)
                  const nuevoAcumulado = Math.min(vga12.acumulado_total + diasNoUtilizados, maxAcumulacion);

                  // Reiniciar el año actual
                  vga12.asignada_anual = licenseType.cantidad_maxima; // 15 días nuevos
                  vga12.utilizada_anual = 0;
                  vga12.disponible_anual = licenseType.cantidad_maxima + (nuevoAcumulado - vga12.acumulado_total); // 15 + acumulado
                  vga12.acumulado_total = nuevoAcumulado; // Actualizar total acumulado
                  vga12.ultima_actualizacion = new Date();

                  console.log(`🔄 VGA12 renovado: +${diasNoUtilizados} días acumulados, total acumulado: ${nuevoAcumulado}/${maxAcumulacion}`);
                } else {
                  // Renovación normal para otros tipos de días
                  disponibilidad.licencias_dias[licenseType.codigo].asignada_anual = licenseType.cantidad_maxima;
                  disponibilidad.licencias_dias[licenseType.codigo].utilizada_anual = 0;
                  disponibilidad.licencias_dias[licenseType.codigo].disponible_anual = licenseType.cantidad_maxima;
                  disponibilidad.licencias_dias[licenseType.codigo].ultima_actualizacion = new Date();
                }
              }
              break;
          }
        }
      }

             disponibilidad.año_actual = currentYear;
       disponibilidad.ultima_renovacion_anual = getCurrentDateInElSalvador();

      // Actualizar empleado
      const employeeRef = doc(db, this.employeesCollection, employeeId);
      await updateDoc(employeeRef, {
        disponibilidad,
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ Disponibilidad anual renovada para empleado: ${employeeId}`);
    } catch (error) {
      console.error('❌ Error renovando disponibilidad anual:', error);
      throw new Error('Error al renovar disponibilidad anual');
    }
  }

  // Renovar disponibilidad mensual
  static async renewMonthlyAvailability(employeeId: string): Promise<void> {
    try {
      console.log(`🔄 Renovando disponibilidad mensual para empleado: ${employeeId}`);
      console.log(`🔐 Usuario actual: ${auth.currentUser?.uid || 'No autenticado'}`);

      const employee = await this.getEmployeeById(employeeId);
      if (!employee?.disponibilidad) {
        console.log(`❌ Empleado ${employeeId} no encontrado o sin disponibilidad`);
        throw new Error('Empleado o disponibilidad no encontrada');
      }

             const licenseTypes = await this.getActiveLicenseTypes();
       const currentMonth = getCurrentDateInElSalvador().getMonth() + 1;
      const disponibilidad = { ...employee.disponibilidad };

      // Renovar licencias mensuales
      for (const licenseType of licenseTypes) {
        if (licenseType.periodo_control === 'mensual') {
          switch (licenseType.categoria) {
            case 'DIAS':
              if (disponibilidad.licencias_dias[licenseType.codigo]) {
                disponibilidad.licencias_dias[licenseType.codigo].asignada_mensual = licenseType.cantidad_maxima;
                disponibilidad.licencias_dias[licenseType.codigo].utilizada_mes_actual = 0;
                disponibilidad.licencias_dias[licenseType.codigo].disponible_mes_actual = licenseType.cantidad_maxima;
                disponibilidad.licencias_dias[licenseType.codigo].ultima_actualizacion = new Date();
              }
              break;
            case 'OCASION': {
              // Manejar licencias por ocasión con control mensual (OM14, CT15)
              if (!disponibilidad.licencias_ocasion) {
                disponibilidad.licencias_ocasion = {} as Record<string, LicenciaOcasion>;
              }

              // OM14
              if (licenseType.codigo === 'OM14') {
                if (!disponibilidad.licencias_ocasion.OM14) {
                  disponibilidad.licencias_ocasion.OM14 = {
                    codigo: 'OM14',
                    nombre: 'Licencia por Olvido de Marcación',
                    categoria: 'OCASION',
                    periodo_control: 'mensual',
                    asignada_mensual: licenseType.cantidad_maxima,
                    max_por_solicitud: licenseType.max_por_solicitud,
                    unidad: licenseType.unidad_control,
                    utilizada_mes_actual: 0,
                    disponible_mes_actual: licenseType.cantidad_maxima,
                    uso_mensual: {},
                    historial_uso: [],
                    total_dias_año: 0,
                    total_solicitudes_año: 0,
                    solicitudes_activas: [],
                    ultima_actualizacion: getCurrentDateInElSalvador(),
                  } as unknown as LicenciaOcasion;
                } else {
                  const om14 = disponibilidad.licencias_ocasion.OM14;
                  om14.periodo_control = 'mensual';
                  om14.asignada_mensual = licenseType.cantidad_maxima;
                  om14.utilizada_mes_actual = 0;
                  om14.disponible_mes_actual = licenseType.cantidad_maxima;
                  om14.max_por_solicitud = licenseType.max_por_solicitud;
                  om14.unidad = licenseType.unidad_control;
                  om14.ultima_actualizacion = getCurrentDateInElSalvador();
                }
              }

              // CT15
              if (licenseType.codigo === 'CT15') {
                if (!disponibilidad.licencias_ocasion.CT15) {
                  disponibilidad.licencias_ocasion.CT15 = {
                    codigo: 'CT15',
                    nombre: 'Licencia por Cambio de Turno',
                    categoria: 'OCASION',
                    periodo_control: 'mensual',
                    asignada_mensual: licenseType.cantidad_maxima,
                    max_por_solicitud: licenseType.max_por_solicitud,
                    unidad: licenseType.unidad_control,
                    utilizada_mes_actual: 0,
                    disponible_mes_actual: licenseType.cantidad_maxima,
                    uso_mensual: {},
                    historial_uso: [],
                    total_dias_año: 0,
                    total_solicitudes_año: 0,
                    solicitudes_activas: [],
                    ultima_actualizacion: getCurrentDateInElSalvador(),
                  } as unknown as LicenciaOcasion;
                } else {
                  const ct15 = disponibilidad.licencias_ocasion.CT15;
                  ct15.periodo_control = 'mensual';
                  ct15.asignada_mensual = licenseType.cantidad_maxima;
                  ct15.utilizada_mes_actual = 0;
                  ct15.disponible_mes_actual = licenseType.cantidad_maxima;
                  ct15.max_por_solicitud = licenseType.max_por_solicitud;
                  ct15.unidad = licenseType.unidad_control;
                  ct15.ultima_actualizacion = getCurrentDateInElSalvador();
                }
              }
              break;
            }
          }
        }
      }

             disponibilidad.mes_actual = currentMonth;
       disponibilidad.ultima_renovacion_mensual = getCurrentDateInElSalvador();

      // Actualizar empleado
      const employeeRef = doc(db, this.employeesCollection, employeeId);
      await updateDoc(employeeRef, {
        disponibilidad,
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ Disponibilidad mensual renovada para empleado: ${employeeId}`);
    } catch (error) {
      console.error('❌ Error renovando disponibilidad mensual:', error);
      throw new Error('Error al renovar disponibilidad mensual');
    }
  }

       // ========================================
  // GESTIÓN DE SOLICITUDES DE LICENCIAS
  // ========================================

  // Crear solicitud de licencia (aprobación automática)
  static async createLicenseRequest(data: CreateLicenseRequestData): Promise<LicenseRequest> {
    try {
      console.log(`🔄 Creando solicitud de licencia para empleado: ${data.employeeId}`);
      
      // Obtener información del tipo de licencia
      const licenseType = await this.getLicenseTypeByCode(data.licenseTypeCode);
      if (!licenseType) {
        throw new Error('Tipo de licencia no encontrado');
      }

      // Obtener empleado
      const employee = await this.getEmployeeById(data.employeeId);
      if (!employee) {
        throw new Error('Empleado no encontrado');
      }

      // Validar disponibilidad
      const availableQuantity = await this.getAvailableQuantity(data.employeeId, data.licenseTypeCode);
      if (data.quantity > availableQuantity) {
        throw new Error(`Cantidad solicitada (${data.quantity}) excede la disponibilidad (${availableQuantity})`);
      }

      // Crear la solicitud
      const docRef = doc(collection(db, this.licenseRequestsCollection));
      const licenseRequest: Omit<LicenseRequest, 'id'> = {
        employeeId: data.employeeId,
        licenseTypeCode: data.licenseTypeCode,
        licenseTypeName: licenseType.nombre,
        startDate: data.startDate,
        endDate: data.endDate,
        quantity: data.quantity,
        reason: data.reason,
        observations: data.observations,
        status: 'active',
                 createdAt: getCurrentDateInElSalvador(),
         updatedAt: getCurrentDateInElSalvador(),
      };

      await setDoc(docRef, licenseRequest);

      // Actualizar disponibilidad del empleado
      console.log('🔄 ACTUALIZANDO DISPONIBILIDAD:', {
        employeeId: data.employeeId,
        licenseTypeCode: data.licenseTypeCode,
        quantity: data.quantity,
        startDate: data.startDate,
        licenseType: licenseType
      });
      
      await this.updateEmployeeAvailability(data.employeeId, data.licenseTypeCode, data.quantity, data.startDate);
      
      console.log('✅ DISPONIBILIDAD ACTUALIZADA');

      console.log(`✅ Solicitud de licencia creada: ${docRef.id}`);
      
      return {
        id: docRef.id,
        ...licenseRequest,
      };
    } catch (error) {
      console.error('❌ Error creando solicitud de licencia:', error);
      throw error;
    }
  }

  // Obtener solicitudes de un empleado
  static async getEmployeeLicenseRequests(employeeId: string): Promise<LicenseRequest[]> {
    try {
      console.log('🔍 DEBUG getEmployeeLicenseRequests:', {
        employeeId,
        collection: this.licenseRequestsCollection,
        auth: !!auth.currentUser,
        userId: auth.currentUser?.uid
      });

      // Intentar primero sin orderBy para verificar permisos
      const simpleQuery = query(
        collection(db, this.licenseRequestsCollection),
        where('employeeId', '==', employeeId)
      );

      console.log('🔍 DEBUG: Ejecutando consulta simple...');
      const simpleSnapshot = await getDocs(simpleQuery);
      console.log('✅ DEBUG: Consulta simple exitosa, documentos encontrados:', simpleSnapshot.size);

      // Ahora intentar con orderBy
      console.log('🔍 DEBUG: Ejecutando consulta con orderBy...');
      const q = query(
        collection(db, this.licenseRequestsCollection),
        where('employeeId', '==', employeeId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      console.log('✅ DEBUG: Consulta completa exitosa, documentos encontrados:', querySnapshot.size);

      const requests = querySnapshot.docs.map(doc => this.mapDocumentToLicenseRequest(doc));
      console.log('✅ DEBUG: Mapeo completado, solicitudes procesadas:', requests.length);

      // Si la consulta con orderBy falla, intentar sin orderBy como respaldo
      if (requests.length === 0 && simpleSnapshot.size > 0) {
        console.log('⚠️ DEBUG: orderBy falló pero hay datos sin ordenar, usando consulta simple...');
        return simpleSnapshot.docs.map(doc => this.mapDocumentToLicenseRequest(doc));
      }

      return requests;
    } catch (error) {
      console.error('❌ Error getting employee license requests:', error);
      console.error('❌ Detalles del error:', {
        message: error.message,
        code: error.code,
        name: error.name
      });

      // Intentar consulta simple como respaldo si la consulta con orderBy falla
      try {
        console.log('🔄 DEBUG: Intentando consulta simple como respaldo...');
        const simpleQuery = query(
          collection(db, this.licenseRequestsCollection),
          where('employeeId', '==', employeeId)
        );
        const simpleSnapshot = await getDocs(simpleQuery);
        console.log('✅ DEBUG: Consulta de respaldo exitosa:', simpleSnapshot.size, 'documentos');

        const requests = simpleSnapshot.docs.map(doc => this.mapDocumentToLicenseRequest(doc));
        console.log('⚠️ DEBUG: Usando datos sin ordenar por fecha');
        return requests;
      } catch (fallbackError) {
        console.error('❌ Error incluso en consulta de respaldo:', fallbackError);
        throw new Error('Error al obtener solicitudes de licencia del empleado');
      }
    }
  }

     // Actualizar solicitud de licencia
   static async updateLicenseRequest(requestId: string, updates: Partial<LicenseRequest>): Promise<void> {
     try {
       console.log(`🔄 Actualizando solicitud de licencia: ${requestId}`);
       
       // Obtener la solicitud actual antes de actualizarla
       const docRef = doc(db, this.licenseRequestsCollection, requestId);
       const docSnap = await getDoc(docRef);
       
       if (!docSnap.exists()) {
         throw new Error('Solicitud de licencia no encontrada');
       }
       
       const currentRequest = this.mapDocumentToLicenseRequest(docSnap);
       
       console.log('📋 SOLICITUD ACTUAL A RESTAURAR:', {
         employeeId: currentRequest.employeeId,
         licenseTypeCode: currentRequest.licenseTypeCode,
         quantity: currentRequest.quantity,
         startDate: currentRequest.startDate
       });
       
       // Restaurar disponibilidad de la solicitud actual
       await this.restoreEmployeeAvailability(
         currentRequest.employeeId, 
         currentRequest.licenseTypeCode, 
         currentRequest.quantity, 
         currentRequest.startDate
       );
      
      // Actualizar la solicitud
      await updateDoc(docRef, {
        ...updates,
        updatedAt: getCurrentDateInElSalvador(),
      });
      
             // Si hay cambios en cantidad o fechas, actualizar disponibilidad con los nuevos valores
       if (updates.quantity !== undefined || updates.startDate !== undefined) {
         const newQuantity = updates.quantity ?? currentRequest.quantity;
         const newStartDate = updates.startDate ?? currentRequest.startDate;
         
         console.log('📋 NUEVOS VALORES A APLICAR:', {
           employeeId: currentRequest.employeeId,
           licenseTypeCode: currentRequest.licenseTypeCode,
           newQuantity: newQuantity,
           newStartDate: newStartDate,
           quantityChanged: updates.quantity !== undefined,
           startDateChanged: updates.startDate !== undefined
         });
         
         await this.updateEmployeeAvailability(
           currentRequest.employeeId, 
           currentRequest.licenseTypeCode, 
           newQuantity, 
           newStartDate
         );
       }
      
      console.log(`✅ Solicitud de licencia actualizada: ${requestId}`);
    } catch (error) {
      console.error('Error updating license request:', error);
      throw new Error('Error al actualizar solicitud de licencia');
    }
  }

     // Eliminar solicitud de licencia
   static async deleteLicenseRequest(requestId: string): Promise<void> {
     try {
       console.log(`🗑️ Eliminando solicitud de licencia: ${requestId}`);
       
       // Obtener la solicitud antes de eliminarla
       const docRef = doc(db, this.licenseRequestsCollection, requestId);
       const docSnap = await getDoc(docRef);
       
       if (!docSnap.exists()) {
         throw new Error('Solicitud de licencia no encontrada');
       }
       
       const request = this.mapDocumentToLicenseRequest(docSnap);
       
       console.log('🗑️ SOLICITUD A ELIMINAR Y RESTAURAR:', {
         employeeId: request.employeeId,
         licenseTypeCode: request.licenseTypeCode,
         quantity: request.quantity,
         startDate: request.startDate
       });
       
       // Restaurar disponibilidad del empleado
       await this.restoreEmployeeAvailability(
         request.employeeId, 
         request.licenseTypeCode, 
         request.quantity, 
         request.startDate
       );
      
      // Eliminar la solicitud
      await deleteDoc(docRef);
      
      console.log(`✅ Solicitud de licencia eliminada: ${requestId}`);
    } catch (error) {
      console.error('Error deleting license request:', error);
      throw new Error('Error al eliminar solicitud de licencia');
    }
  }

  // ========================================
  // MÉTODOS PRIVADOS
  // ========================================

   // Remover valores undefined de un objeto
   private static removeUndefinedValues(obj: unknown): unknown {
     if (obj === null || obj === undefined) {
       return obj;
     }
     
     if (Array.isArray(obj)) {
       return obj.map(item => this.removeUndefinedValues(item));
     }
     
     if (typeof obj === 'object') {
       const cleaned: Record<string, unknown> = {};
       for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
         if (value !== undefined) {
           cleaned[key] = this.removeUndefinedValues(value);
         }
       }
       return cleaned;
     }
     
     return obj;
   }

  // Mapear documento de Firestore a objeto LicenseType
  private static mapDocumentToLicenseType(doc: QueryDocumentSnapshot<DocumentData>): LicenseType {
    const data = doc.data();
    return {
      id: doc.id,
      codigo: data.codigo,
      nombre: data.nombre,
      categoria: data.categoria,
      periodo_control: data.periodo_control,
      cantidad_maxima: data.cantidad_maxima,
      unidad_control: data.unidad_control,
      aplica_genero: data.aplica_genero,
      max_por_solicitud: data.max_por_solicitud,
      descripcion: data.descripcion,
      activo: data.activo,
      calculo_automatico_fecha_fin: data.calculo_automatico_fecha_fin,
      dias_calculo_automatico: data.dias_calculo_automatico,
      requiere_historial_anual: data.requiere_historial_anual,
      max_acumulacion: data.max_acumulacion,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
    };
  }

  // Mapear documento de Firestore a objeto LicenseRequest
  private static mapDocumentToLicenseRequest(doc: QueryDocumentSnapshot<DocumentData>): LicenseRequest {
    const data = doc.data();
    return {
      id: doc.id,
      employeeId: data.employeeId,
      licenseTypeCode: data.licenseTypeCode,
      licenseTypeName: data.licenseTypeName,
      startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(),
      endDate: data.endDate?.toDate ? data.endDate.toDate() : new Date(),
      quantity: data.quantity,
      reason: data.reason,
      observations: data.observations,
      status: data.status,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
    };
  }

  // ✅ NUEVA FUNCIÓN: Limpiar y corregir disponibilidad de MG07
  static async cleanMG07Availability(employeeId: string): Promise<void> {
    try {
      console.log(`🧹 Limpiando disponibilidad de MG07 para empleado: ${employeeId}`);
      const employee = await this.getEmployeeById(employeeId);
      if (!employee?.disponibilidad) {
        console.log('❌ Empleado sin disponibilidad, inicializando...');
        await this.initializeEmployeeAvailability(employeeId);
        return;
      }

      const disponibilidad = { ...employee.disponibilidad };
      
      // ✅ PASO 1: Remover MG07 de licencias_dias si existe
      if (disponibilidad.licencias_dias?.MG07) {
        console.log('🔍 MG07 encontrado en licencias_dias, removiendo...');
        delete disponibilidad.licencias_dias.MG07;
        console.log('✅ MG07 removido de licencias_dias');
      }

      // ✅ PASO 2: Asegurar que MG07 esté en licencias_ocasion con configuración correcta
      if (!disponibilidad.licencias_ocasion) {
        disponibilidad.licencias_ocasion = {};
      }

      disponibilidad.licencias_ocasion.MG07 = {
        codigo: 'MG07',
        nombre: 'Licencia por Maternidad',
        categoria: 'OCASION',
        periodo_control: 'ninguno',
        max_por_solicitud: 112,
        unidad: 'dias',
        historial_uso: [],
        total_dias_año: 0,
        total_solicitudes_año: 0,
        solicitudes_activas: [],
        ultima_actualizacion: getCurrentDateInElSalvador()
      };

      console.log('✅ MG07 configurado correctamente en licencias_ocasion');

      // ✅ PASO 3: Actualizar empleado
      const employeeRef = doc(db, this.employeesCollection, employeeId);
      await updateDoc(employeeRef, {
        disponibilidad: this.removeUndefinedValues(disponibilidad),
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ Disponibilidad de MG07 limpiada para empleado: ${employeeId}`);
    } catch (error) {
      console.error('❌ Error limpiando disponibilidad de MG07:', error);
      throw new Error('Error al limpiar disponibilidad de MG07');
    }
  }

  // Obtener empleado por ID
  private static async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const docRef = doc(db, this.employeesCollection, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          employeeId: data.employeeId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          department: data.department,
          position: data.position,
          employeeType: data.employeeType || 'operativo',
          hireDate: data.hireDate?.toDate ? data.hireDate.toDate() : new Date(),
          birthDate: data.birthDate?.toDate ? data.birthDate.toDate() : new Date(),
          salary: data.salary,
          gender: data.gender || 'male',
          personalType: data.personalType || 'full-time',
          address: data.address,
          emergencyContact: data.emergencyContact,
          isActive: data.isActive,
          disponibilidad: data.disponibilidad,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting employee by ID:', error);
      throw new Error('Error al obtener empleado');
    }
  }
}
