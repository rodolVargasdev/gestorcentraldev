import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  AlertCircle,
  Save,
  Loader2,
  Info
} from 'lucide-react';
import { useLicenseStore } from '../stores/licenseStore';
import { useEmployeeStore } from '../stores/employeeStore';
import { type LicenseType } from '../types/licenseTypes';
import { formatTimeTotal, formatInputDate } from '../utils/formUtils';
import { calcularDiasCalendario, calcularFechaFinMaternidad, calcularFechaFinLactancia, haySolapamientoFechas } from '../utils/dateUtils';
import { validateRequestLimits, getValidationMessage } from '../types/licenseTypes';

interface NewLicenseFormData {
  tipoLicencia: string;
  fechaInicio: string;
  fechaFin: string;
  fechaOlvido?: string; // OM14
  tipoOlvido?: 'entrada' | 'salida'; // OM14
  justificacionOlvido?: string; // OM14
  fechaNoTrabajara?: string; // CT15
  fechaSiTrabajara?: string;  // CT15
  horas?: number;
  minutos?: number;
  cantidad?: number;
  motivo: string;
  observaciones?: string;
}

export function NewLicensePage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [selectedLicenseType, setSelectedLicenseType] = useState<LicenseType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    licenseTypes,
    employeeAvailability,
    loading,
    loadLicenseTypes,
    loadEmployeeAvailability,
    createLicenseRequest
  } = useLicenseStore();

  const { currentEmployee, loadEmployeeById } = useEmployeeStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    setValue
  } = useForm<NewLicenseFormData>({
    mode: 'onChange'
  });

  const watchedTipoLicencia = watch('tipoLicencia');
  const watchedFechaInicio = watch('fechaInicio');
  const watchedFechaFin = watch('fechaFin');
  const watchedFechaNoTrabajara = watch('fechaNoTrabajara');
  const watchedFechaSiTrabajara = watch('fechaSiTrabajara');
  const watchedFechaOlvido = watch('fechaOlvido');
  const watchedTipoOlvido = watch('tipoOlvido');
  const watchedJustificacionOlvido = watch('justificacionOlvido');
  const watchedHoras = watch('horas');
  const watchedMinutos = watch('minutos');

  useEffect(() => {
    if (employeeId) {
      loadEmployeeById(employeeId);
      loadLicenseTypes();
      loadEmployeeAvailability(employeeId);
    }
  }, [employeeId, loadEmployeeById, loadLicenseTypes, loadEmployeeAvailability]);

  useEffect(() => {
    if (watchedTipoLicencia && licenseTypes.length > 0) {
      const licenseType = licenseTypes.find(lt => lt.codigo === watchedTipoLicencia);
      console.log('🎯 Tipo de licencia seleccionado:', licenseType);
      
      // ✅ LOG ESPECÍFICO PARA LG08 - CONFIRMAR CAMBIOS
      if (licenseType?.codigo === 'LG08') {
        console.log('🍼 LG08 - CONFIGURACIÓN ACTUALIZADA:', {
          codigo: licenseType.codigo,
          categoria: licenseType.categoria,
          periodo_control: licenseType.periodo_control,
          unidad_control: licenseType.unidad_control,
          max_por_solicitud: licenseType.max_por_solicitud,
          calculo_automatico_fecha_fin: licenseType.calculo_automatico_fecha_fin,
          dias_calculo_automatico: licenseType.dias_calculo_automatico,
          aplica_genero: licenseType.aplica_genero
        });
        console.log('✅ LG08 - CAMBIOS CONFIRMADOS: unidad_control = dias, max_por_solicitud = 180');
      }
      
      setSelectedLicenseType(licenseType || null);
    }
  }, [watchedTipoLicencia, licenseTypes]);

  // Calcular cantidad máxima disponible
  const getAvailableQuantity = (): number => {
    if (!selectedLicenseType || !employeeAvailability) return 0;

    console.log('🔍 DEBUG getAvailableQuantity en componente:', {
      codigo: selectedLicenseType.codigo,
      categoria: selectedLicenseType.categoria,
      periodo_control: selectedLicenseType.periodo_control,
      max_por_solicitud: selectedLicenseType.max_por_solicitud
    });

    switch (selectedLicenseType.categoria) {
      case 'HORAS': {
        const horaLicencia = employeeAvailability.licencias_horas?.[selectedLicenseType.codigo];
        const disponible = horaLicencia?.disponible_anual || 0;
        console.log('🔍 DEBUG HORAS en componente:', disponible);
        return disponible;
      }
      
      case 'DIAS': {
        const diaLicencia = employeeAvailability.licencias_dias?.[selectedLicenseType.codigo];
        console.log('🔍 DEBUG DIAS en componente: periodo_control =', selectedLicenseType.periodo_control);
        
        if (selectedLicenseType.periodo_control === 'anual') {
          const disponible = diaLicencia?.disponible_anual || 0;
          console.log('🔍 DEBUG DIAS ANUAL en componente:', disponible);
          return disponible;
        } else if (selectedLicenseType.periodo_control === 'mensual') {
          const disponible = diaLicencia?.disponible_mes_actual || 0;
          console.log('🔍 DEBUG DIAS MENSUAL en componente:', disponible);
          return disponible;
        } else if (selectedLicenseType.periodo_control === 'ninguno') {
          // Para permisos por evento (como maternidad), retornar max_por_solicitud o un valor alto
          const disponible = selectedLicenseType.max_por_solicitud || 999;
          console.log('🔍 DEBUG DIAS NINGUNO en componente: max_por_solicitud =', selectedLicenseType.max_por_solicitud, 'retornando', disponible);
          return disponible;
        }
        console.log('🔍 DEBUG DIAS DEFAULT en componente: 0');
        return 0;
      }
      
      case 'OCASION': {
        const ocasionLicencia = employeeAvailability.licencias_ocasion?.[selectedLicenseType.codigo];
        
        if (selectedLicenseType.periodo_control === 'mensual') {
          // Para licencias con control mensual (OM14, CT15)
          // Si no hay disponibilidad inicializada, usar el valor por defecto
          let disponible = ocasionLicencia?.disponible_mes_actual;
          if (disponible === undefined || disponible === null) {
            // Usar valor por defecto según el tipo de licencia
            disponible = selectedLicenseType.codigo === 'OM14' ? 3 : 3;
            console.log('⚠️ DEBUG OCASION MENSUAL: Usando valor por defecto', {
              codigo: selectedLicenseType.codigo,
              disponible_por_defecto: disponible
            });
          }
          console.log('🔍 DEBUG OCASION MENSUAL en componente:', {
            codigo: selectedLicenseType.codigo,
            disponible_mes_actual: disponible,
            asignada_mensual: ocasionLicencia?.asignada_mensual,
            utilizada_mes_actual: ocasionLicencia?.utilizada_mes_actual
          });
          return disponible;
        } else {
          // Para licencias sin control (EG03, ES04, etc.)
          const disponible = selectedLicenseType.max_por_solicitud || 999;
          console.log('🔍 DEBUG OCASION SIN CONTROL en componente: max_por_solicitud =', selectedLicenseType.max_por_solicitud, 'retornando', disponible);
          return disponible;
        }
      }
      
      default:
        console.log('🔍 DEBUG DEFAULT en componente: 0');
        return 0;
    }
  };

  // ✅ NUEVA FUNCIÓN: Calcular cantidad automáticamente para OCASIÓN y licencias con cálculo automático
  const calcularCantidadAutomatica = (data: NewLicenseFormData): number => {
    if (!selectedLicenseType) return 0;

    console.log('🔢 Calculando cantidad automática:', {
      codigo: selectedLicenseType.codigo,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin
    });

    switch (selectedLicenseType.codigo) {
      case 'OM14':
        console.log('📝 Cantidad OM14: 1 olvido');
        return 1; // Siempre 1 olvido
      
      case 'CT15':
        console.log('🔄 Cantidad CT15: 1 cambio de turno');
        return 1; // Siempre 1 cambio de turno
      
      case 'MG07':
        if (data.fechaInicio && data.fechaFin) {
          const inicio = new Date(data.fechaInicio);
          const fin = new Date(data.fechaFin);
          const dias = calcularDiasCalendario(inicio, fin);
          console.log('👶 MG07 - CÁLCULO AUTOMÁTICO:', {
            fechaInicio: data.fechaInicio,
            fechaFin: data.fechaFin,
            diasCalculados: dias,
            maxPermitido: 112
          });
          console.log('✅ MG07 - Cantidad calculada automáticamente:', dias, 'días (maternidad)');
          return dias;
        }
        console.log('⚠️ MG07 - No se pudieron calcular los días (fechas faltantes)');
        return 0;
      
      case 'LG08':
        if (data.fechaInicio && data.fechaFin) {
          const inicio = new Date(data.fechaInicio);
          const fin = new Date(data.fechaFin);
          const dias = calcularDiasCalendario(inicio, fin);
          console.log('🍼 LG08 - CÁLCULO AUTOMÁTICO:', {
            fechaInicio: data.fechaInicio,
            fechaFin: data.fechaFin,
            diasCalculados: dias,
            maxPermitido: 180
          });
          console.log('✅ LG08 - Cantidad calculada automáticamente:', dias, 'días (lactancia)');
          return dias;
        }
        console.log('⚠️ LG08 - No se pudieron calcular los días (fechas faltantes)');
        return 0;
      
      case 'VG11':
        if (data.fechaInicio && data.fechaFin) {
          const inicio = new Date(data.fechaInicio);
          const fin = new Date(data.fechaFin);
          const dias = calcularDiasCalendario(inicio, fin);
          console.log('🏖️ VG11 - CÁLCULO AUTOMÁTICO:', {
            fechaInicio: data.fechaInicio,
            fechaFin: data.fechaFin,
            diasCalculados: dias,
            maxPermitido: 15
          });
          console.log('✅ VG11 - Cantidad calculada automáticamente:', dias, 'días (vacaciones)');
          return dias;
        }
        console.log('⚠️ VG11 - No se pudieron calcular los días (fechas faltantes)');
        return 0;
      
      default: // Otros OCASIÓN
        if (data.fechaInicio && data.fechaFin) {
          const inicio = new Date(data.fechaInicio);
          const fin = new Date(data.fechaFin);
          const dias = calcularDiasCalendario(inicio, fin);
          console.log('📅 Cantidad OCASIÓN:', dias, 'días');
          return dias;
        }
        return 0;
    }
  };

  // ✅ NUEVA FUNCIÓN: Validar límites por solicitud
  const validarLimitesSolicitud = (cantidad: number): boolean => {
    if (!selectedLicenseType) return true;
    
    // ✅ LOG ESPECÍFICO PARA DEBUG DE VALIDACIÓN
    console.log('🔍 DEBUG validarLimitesSolicitud:', {
      codigo: selectedLicenseType.codigo,
      max_por_solicitud: selectedLicenseType.max_por_solicitud,
      unidad_control: selectedLicenseType.unidad_control,
      cantidadSolicitada: cantidad,
      resultado: validateRequestLimits(selectedLicenseType, cantidad)
    });
    
    // ✅ LOG ESPECÍFICO PARA LG08
    if (selectedLicenseType.codigo === 'LG08') {
      console.log('🍼 LG08 - VALIDACIÓN DE LÍMITES:', {
        max_por_solicitud: selectedLicenseType.max_por_solicitud,
        unidad_control: selectedLicenseType.unidad_control,
        cantidadSolicitada: cantidad,
        esValido: validateRequestLimits(selectedLicenseType, cantidad),
        mensaje: getValidationMessage(selectedLicenseType)
      });
    }
    
    return validateRequestLimits(selectedLicenseType, cantidad);
  };

  // ✅ NUEVA FUNCIÓN: Calcular fecha fin automática
  const calcularFechaFinAutomatica = (fechaInicio: string): string => {
    if (!selectedLicenseType || !fechaInicio) return '';
    
    console.log('🔧 Calculando fecha fin automática:', {
      codigo: selectedLicenseType.codigo,
      fechaInicio
    });
    
    const inicio = new Date(fechaInicio);
    
    switch (selectedLicenseType.codigo) {
      case 'MG07': {
        const fechaFinMaternidad = calcularFechaFinMaternidad(inicio);
        const resultado = fechaFinMaternidad.toISOString().split('T')[0];
        console.log('👶 Fecha fin maternidad calculada:', resultado);
        return resultado;
      }
      
      case 'LG08': {
        const fechaFinLactancia = calcularFechaFinLactancia(inicio);
        const resultado = fechaFinLactancia.toISOString().split('T')[0];
        console.log('🍼 LG08 - CÁLCULO FECHA FIN:', {
          fechaInicio: fechaInicio,
          fechaFinCalculada: resultado,
          diasTranscurridos: 180
        });
        console.log('✅ LG08 - Fecha fin lactancia calculada automáticamente:', resultado);
        return resultado;
      }
      
      default:
        console.log('❌ No se encontró cálculo automático para:', selectedLicenseType.codigo);
        return '';
    }
  };

  // ✅ NUEVA FUNCIÓN: Verificar solapamiento de fechas
  const verificarSolapamiento = (fechaInicio: string, fechaFin: string): boolean => {
    if (!selectedLicenseType || !fechaInicio || !fechaFin) return false;
    
    // Solo verificar para MG07 y LG08
    if (selectedLicenseType.codigo !== 'MG07' && selectedLicenseType.codigo !== 'LG08') {
      return false;
    }
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    // Obtener fechas existentes del historial
    const fechasExistentes: Array<{ fechaInicio: Date; fechaFin: Date }> = [];
    
    if (employeeAvailability) {
      const historial = employeeAvailability.licencias_ocasion?.[selectedLicenseType.codigo]?.historial_uso || [];
      fechasExistentes.push(...historial.map(h => ({
        fechaInicio: new Date(h.fecha_inicio),
        fechaFin: new Date(h.fecha_fin)
      })));
    }
    
    return haySolapamientoFechas(inicio, fin, fechasExistentes);
  };

  // ✅ NUEVA FUNCIÓN: Obtener mensaje de validación
  const obtenerMensajeValidacion = (): string => {
    if (!selectedLicenseType) return '';
    
    const mensaje = getValidationMessage(selectedLicenseType);
    
    // ✅ LOG ESPECÍFICO PARA DEBUG DE MENSAJE
    console.log('🔍 DEBUG obtenerMensajeValidacion:', {
      codigo: selectedLicenseType.codigo,
      max_por_solicitud: selectedLicenseType.max_por_solicitud,
      unidad_control: selectedLicenseType.unidad_control,
      mensajeGenerado: mensaje
    });
    
    // ✅ LOG ESPECÍFICO PARA LG08
    if (selectedLicenseType.codigo === 'LG08') {
      console.log('🍼 LG08 - MENSAJE DE VALIDACIÓN:', {
        max_por_solicitud: selectedLicenseType.max_por_solicitud,
        unidad_control: selectedLicenseType.unidad_control,
        mensaje: mensaje
      });
    }
    
    return mensaje;
  };

  // ✅ NUEVA FUNCIÓN: Verificar si empleado es elegible
  const esEmpleadoElegible = (): boolean => {
    if (!selectedLicenseType || !currentEmployee) return true;
    
    if (selectedLicenseType.aplica_genero) {
      const generoEmpleado = currentEmployee.gender === 'female' ? 'F' : 'M';
      return generoEmpleado === selectedLicenseType.aplica_genero;
    }
    
    return true;
  };

  // ✅ EFECTO: Calcular fecha fin automática cuando cambia fecha inicio
  useEffect(() => {
    console.log('🔍 useEffect fecha fin automática:', {
      selectedLicenseType: selectedLicenseType?.codigo,
      calculo_automatico: selectedLicenseType?.calculo_automatico_fecha_fin,
      watchedFechaInicio
    });
    
    if (selectedLicenseType?.calculo_automatico_fecha_fin && watchedFechaInicio) {
      console.log('🔄 Calculando fecha fin automática para:', selectedLicenseType.codigo);
      const fechaFinAutomatica = calcularFechaFinAutomatica(watchedFechaInicio);
      console.log('📅 Fecha fin calculada:', fechaFinAutomatica);
      
      if (fechaFinAutomatica) {
        setValue('fechaFin', fechaFinAutomatica);
        // También calcular la cantidad automáticamente
        const cantidad = calcularCantidadAutomatica({
          fechaInicio: watchedFechaInicio,
          fechaFin: fechaFinAutomatica
        } as NewLicenseFormData);
        console.log('📊 Cantidad calculada:', cantidad);
        setValue('cantidad', cantidad);
      }
    }
  }, [watchedFechaInicio, selectedLicenseType, setValue]);

  // ✅ EFECTO: Calcular cantidad automática cuando cambian las fechas
  useEffect(() => {
    if (watchedFechaInicio && watchedFechaFin) {
      // Para licencias con cálculo automático (MG07, LG08, VG11) o OCASIÓN
      if (selectedLicenseType?.calculo_automatico_fecha_fin || 
          selectedLicenseType?.categoria === 'OCASION' ||
          selectedLicenseType?.codigo === 'VG11') {
        const cantidad = calcularCantidadAutomatica({
          fechaInicio: watchedFechaInicio,
          fechaFin: watchedFechaFin
        } as NewLicenseFormData);
        setValue('cantidad', cantidad);
      }
    }
  }, [watchedFechaInicio, watchedFechaFin, selectedLicenseType, setValue]);

  // Validar fechas (sin restricciones de horarios, permitir 24/7/365)
  const validateDates = (): boolean => {
    // Para CT15 y OM14, no validar fechas normales
    if (selectedLicenseType?.codigo === 'CT15' || selectedLicenseType?.codigo === 'OM14') {
      return true;
    }
    
    if (!watchedFechaInicio || !watchedFechaFin) return false;
    
    const startDate = new Date(watchedFechaInicio);
    const endDate = new Date(watchedFechaFin);
    
    // Solo validar que la fecha de fin no sea anterior a la fecha de inicio
    return endDate >= startDate;
  };

  // ✅ ACTUALIZAR: Validación del formulario
  const onSubmit = async (data: NewLicenseFormData) => {
    if (!employeeId || !selectedLicenseType) return;

    try {
      setIsSubmitting(true);

      // ✅ NUEVA VALIDACIÓN: Verificar si empleado es elegible
      if (!esEmpleadoElegible()) {
        setError('El empleado no es elegible para este tipo de licencia');
        return;
      }

             // ✅ NUEVA VALIDACIÓN: Verificar límites por solicitud
       let cantidadParaValidar = 0;
       
                        if (selectedLicenseType.categoria === 'HORAS') {
           // ✅ VALIDACIÓN MEJORADA: Asegurar conversión correcta de valores
           const horas = data.horas !== undefined && data.horas !== null ? Number(data.horas) : 0;
           const minutos = data.minutos !== undefined && data.minutos !== null ? Number(data.minutos) : 0;
           cantidadParaValidar = horas + (minutos / 60);
           
           console.log('🔍 DEBUG VALIDACIÓN HORAS:', {
             dataHoras: data.horas,
             dataMinutos: data.minutos,
             horasConvertidas: horas,
             minutosConvertidos: minutos,
             cantidadParaValidar: cantidadParaValidar
           });
         } else {
         cantidadParaValidar = data.cantidad || 0;
       }
       
       console.log('🔍 DEBUG onSubmit - ANTES DE VALIDAR LÍMITES:', {
         codigo: selectedLicenseType.codigo,
         categoria: selectedLicenseType.categoria,
         cantidad: cantidadParaValidar,
         horas: data.horas,
         minutos: data.minutos
       });
       
       if (!validarLimitesSolicitud(cantidadParaValidar)) {
         const mensaje = obtenerMensajeValidacion();
         console.log('❌ ERROR DE VALIDACIÓN:', {
           codigo: selectedLicenseType.codigo,
           mensaje: mensaje,
           cantidad: cantidadParaValidar
         });
         setError(mensaje);
         return;
       }
       
       console.log('✅ VALIDACIÓN DE LÍMITES EXITOSA:', {
         codigo: selectedLicenseType.codigo,
         cantidad: cantidadParaValidar
       });

      // ✅ NUEVA VALIDACIÓN: Verificar solapamiento de fechas
      if (verificarSolapamiento(data.fechaInicio, data.fechaFin)) {
        setError('No se permiten fechas solapadas para este tipo de licencia');
        return;
      }

      // ✅ NUEVA VALIDACIÓN: Verificar disponibilidad
      const disponible = getAvailableQuantity();
      if (cantidadParaValidar > disponible) {
        setError(`No hay suficiente disponibilidad. Disponible: ${disponible}`);
        return;
      }

      // Validar fechas
      if (!validateDates()) {
        setError('Las fechas seleccionadas no son válidas');
        setIsSubmitting(false);
        return;
      }

      // Crear la solicitud de licencia
      let startDate, endDate;
      
      if (selectedLicenseType.codigo === 'CT15') {
        // Para CT15, usar las fechas específicas del cambio de turno
        startDate = new Date(data.fechaNoTrabajara + 'T00:00:00');
        endDate = new Date(data.fechaSiTrabajara + 'T23:59:59');
      } else if (selectedLicenseType.codigo === 'OM14') {
        // Para OM14, usar la fecha del olvido (mismo día)
        startDate = new Date(data.fechaOlvido + 'T00:00:00');
        endDate = new Date(data.fechaOlvido + 'T23:59:59');
      } else {
        // Para otros tipos, usar las fechas normales
        startDate = new Date(data.fechaInicio + 'T00:00:00');
        endDate = new Date(data.fechaFin + 'T23:59:59');
      }

      // Preparar observaciones adicionales para tipos especiales
      let additionalObservations = data.observaciones || '';
      
      if (selectedLicenseType.codigo === 'OM14') {
        const olvidoInfo = `Tipo de olvido: ${data.tipoOlvido === 'entrada' ? 'Entrada' : 'Salida'}. Justificación: ${data.justificacionOlvido}`;
        additionalObservations = additionalObservations ? `${additionalObservations}\n\n${olvidoInfo}` : olvidoInfo;
      }

      // ✅ CALCULAR CANTIDAD SEGÚN EL TIPO DE LICENCIA
      let quantity = 0;
      
      if (selectedLicenseType.categoria === 'HORAS') {
        // Para licencias por horas, convertir horas y minutos a horas decimales
        const horas = data.horas !== undefined && data.horas !== null ? Number(data.horas) : 0;
        const minutos = data.minutos !== undefined && data.minutos !== null ? Number(data.minutos) : 0;
        quantity = horas + (minutos / 60);
        console.log('🕐 CÁLCULO DE CANTIDAD HORAS:', {
          horas: horas,
          minutos: minutos,
          cantidadTotal: quantity,
          codigo: selectedLicenseType.codigo,
          tipoHoras: typeof horas,
          tipoMinutos: typeof minutos,
          valorHoras: data.horas,
          valorMinutos: data.minutos
        });
        
        // ✅ VALIDACIÓN ADICIONAL: Verificar que los valores sean números válidos
        if (isNaN(horas) || isNaN(minutos)) {
          console.error('❌ ERROR: Valores no numéricos detectados:', {
            horas: data.horas,
            minutos: data.minutos,
            horasParsed: horas,
            minutosParsed: minutos
          });
        }
      } else if (selectedLicenseType.categoria === 'OCASION') {
        // Para licencias por ocasión, verificar si es MG07 (Maternidad) que necesita cálculo de días
        if (selectedLicenseType.codigo === 'MG07') {
          // MG07 es por ocasión pero necesita calcular días automáticamente
          if (data.fechaInicio && data.fechaFin) {
            quantity = calcularCantidadAutomatica(data);
          } else {
            quantity = 0;
          }
          console.log('👶 CÁLCULO DE CANTIDAD MG07 (OCASIÓN):', {
            cantidad: quantity,
            codigo: selectedLicenseType.codigo,
            categoria: selectedLicenseType.categoria,
            fechaInicio: data.fechaInicio,
            fechaFin: data.fechaFin
          });
        } else {
          // Para otras licencias por ocasión (OM14, CT15, etc.), cantidad siempre es 1 evento
          quantity = 1;
          console.log('🎯 CÁLCULO DE CANTIDAD OCASIÓN:', {
            cantidad: quantity,
            codigo: selectedLicenseType.codigo,
            categoria: selectedLicenseType.categoria
          });
        }
      } else {
        // Para licencias por días, usar cantidad directa o cálculo automático
        quantity = data.cantidad || 0;
        if (selectedLicenseType.calculo_automatico_fecha_fin && data.fechaInicio && data.fechaFin) {
          quantity = calcularCantidadAutomatica(data);
        }
        console.log('📊 CÁLCULO DE CANTIDAD DÍAS:', {
          cantidad: quantity,
          codigo: selectedLicenseType.codigo,
          categoria: selectedLicenseType.categoria
        });
      }

      await createLicenseRequest({
        employeeId,
        licenseTypeCode: selectedLicenseType.codigo,
        startDate,
        endDate,
        quantity: quantity, // Usar cantidad calculada
        reason: data.motivo,
        observations: additionalObservations
      });

      // Redirigir al historial
      navigate(`/employees/${employeeId}/license-history`);
    } catch (err) {
      setError('Error al crear la licencia. Intente nuevamente.');
      console.error('Error creating license:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (available: number, requested: number) => {
    if (requested > available) return 'destructive';
    if (requested > available * 0.8) return 'secondary';
    return 'default';
  };



  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!currentEmployee || !employeeAvailability) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Empleado no encontrado</h3>
          <p className="text-gray-600 mb-4">
            No se pudo cargar la información del empleado.
          </p>
          <Button onClick={() => navigate('/employees')}>
            Volver a Empleados
          </Button>
        </div>
      </div>
    );
  }

  const availableQuantity = getAvailableQuantity();

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/employees/${employeeId}/availability`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Nueva Licencia
            </h1>
            <p className="text-gray-600">
              {currentEmployee.firstName} {currentEmployee.lastName}
            </p>
          </div>
        </div>
      </div>

      {/* Información del empleado */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Información del Empleado</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">ID de Empleado</p>
              <p className="font-semibold">{currentEmployee.employeeId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Departamento</p>
              <p className="font-semibold">{currentEmployee.department}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Cargo</p>
              <p className="font-semibold">{currentEmployee.position}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Selección de tipo de licencia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Tipo de Licencia</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Seleccionar tipo de licencia *
                </label>
                <select
                  {...register('tipoLicencia', { required: 'Debe seleccionar un tipo de licencia' })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar...</option>
                  {licenseTypes
                    .filter((licenseType) => {
                      // Si es servicio profesional, solo mostrar OM14 y CT15
                      if (currentEmployee?.isProfessionalService) {
                        return licenseType.codigo === 'OM14' || licenseType.codigo === 'CT15';
                      }
                      return true;
                    })
                    .map((licenseType) => (
                      <option key={licenseType.codigo} value={licenseType.codigo}>
                        {licenseType.codigo} - {licenseType.nombre}
                      </option>
                    ))}
                </select>
                {errors.tipoLicencia && (
                  <p className="text-red-500 text-sm mt-1">{errors.tipoLicencia.message}</p>
                )}
              </div>

              {selectedLicenseType && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{selectedLicenseType.nombre}</h4>
                    <Badge variant="outline">{selectedLicenseType.codigo}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{selectedLicenseType.descripcion}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Categoría:</span>
                      <span className="ml-2">{selectedLicenseType.categoria}</span>
                    </div>
                    <div>
                      <span className="font-medium">Período:</span>
                      <span className="ml-2">{selectedLicenseType.periodo_control}</span>
                    </div>
                    <div>
                      <span className="font-medium">Unidad:</span>
                      <span className="ml-2">{selectedLicenseType.unidad_control}</span>
                    </div>
                    <div>
                      <span className="font-medium">Disponible:</span>
                      <Badge 
                        variant={getStatusColor(availableQuantity, 0)}
                        className="ml-2"
                      >
                        {availableQuantity} {selectedLicenseType.unidad_control}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fechas y cantidad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Detalles de la Licencia</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Información específica según el tipo de licencia */}
            {selectedLicenseType?.categoria === 'HORAS' && (
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Información para licencias por horas:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Ingrese las horas y minutos por separado</li>
                      <li>Si no ingresa horas, se asume 0 horas</li>
                      <li>Si no ingresa minutos, se asume 0 minutos</li>
                      <li>Debe ingresar al menos 1 hora o 1 minuto</li>
                      <li>Los minutos se convierten automáticamente a horas (ej: 30 min = 0.5 horas)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {selectedLicenseType?.categoria === 'DIAS' && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Información para licencias por días:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Ingrese la cantidad de días completos</li>
                      <li>Se calcula automáticamente desde la fecha de inicio hasta la fecha de fin</li>
                      <li>La cantidad debe coincidir con el período seleccionado</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {selectedLicenseType?.categoria === 'OCASION' && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">Información para licencias por ocasión:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Puede solicitar este permiso en cualquier momento</li>
                      <li>Se aceptan solicitudes para fechas pasadas, presentes o futuras</li>
                      <li>No hay restricciones de horarios o días específicos</li>
                      <li>La cantidad se calcula automáticamente según las fechas</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {selectedLicenseType?.codigo === 'OM14' && (
              <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-indigo-800">
                    <p className="font-medium mb-1">Información para olvido de marcación:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Especifique la fecha en que olvidó marcar</li>
                      <li>Indique si fue olvido de entrada o salida</li>
                      <li>Proporcione una justificación detallada del olvido</li>
                      <li>Esto cuenta como 1 olvido mensual</li>
                      <li>Se puede reportar retroactivamente</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {selectedLicenseType?.codigo === 'CT15' && (
              <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-purple-800">
                    <p className="font-medium mb-1">Información para cambio de turno:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Especifique la fecha en que NO trabajará</li>
                      <li>Especifique la fecha en que SÍ trabajará</li>
                      <li>Esto cuenta como 1 cambio de turno mensual</li>
                      <li>Se puede solicitar con anticipación</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Campos de fecha según el tipo de licencia */}
            {selectedLicenseType?.codigo === 'OM14' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Fecha del Olvido *
                    </label>
                    <Input
                      type="date"
                      {...register('fechaOlvido', { required: 'Fecha del olvido es requerida' })}
                    />
                    {errors.fechaOlvido && (
                      <p className="text-red-500 text-sm mt-1">{errors.fechaOlvido.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Tipo de Olvido *
                    </label>
                    <select
                      {...register('tipoOlvido', { required: 'Tipo de olvido es requerido' })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="entrada">Olvido de Entrada</option>
                      <option value="salida">Olvido de Salida</option>
                    </select>
                    {errors.tipoOlvido && (
                      <p className="text-red-500 text-sm mt-1">{errors.tipoOlvido.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Justificación del Olvido *
                  </label>
                  <textarea
                    {...register('justificacionOlvido', { required: 'Justificación del olvido es requerida' })}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Explique detalladamente por qué olvidó marcar la entrada/salida..."
                  />
                  {errors.justificacionOlvido && (
                    <p className="text-red-500 text-sm mt-1">{errors.justificacionOlvido.message}</p>
                  )}
                </div>
              </div>
            ) : selectedLicenseType?.codigo === 'CT15' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fecha que NO trabajará *
                  </label>
                  <Input
                    type="date"
                    {...register('fechaNoTrabajara', { required: 'Fecha que no trabajará es requerida' })}
                  />
                  {errors.fechaNoTrabajara && (
                    <p className="text-red-500 text-sm mt-1">{errors.fechaNoTrabajara.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fecha que SÍ trabajará *
                  </label>
                  <Input
                    type="date"
                    {...register('fechaSiTrabajara', { required: 'Fecha que sí trabajará es requerida' })}
                  />
                  {errors.fechaSiTrabajara && (
                    <p className="text-red-500 text-sm mt-1">{errors.fechaSiTrabajara.message}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fecha de inicio *
                  </label>
                  <Input
                    type="date"
                    {...register('fechaInicio', { required: 'Fecha de inicio es requerida' })}
                  />
                  {errors.fechaInicio && (
                    <p className="text-red-500 text-sm mt-1">{errors.fechaInicio.message}</p>
                  )}
                </div>

                {/* Solo mostrar campo fecha fin si NO tiene cálculo automático */}
                {!selectedLicenseType?.calculo_automatico_fecha_fin && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Fecha de fin *
                    </label>
                    <Input
                      type="date"
                      {...register('fechaFin', { required: 'Fecha de fin es requerida' })}
                    />
                    {errors.fechaFin && (
                      <p className="text-red-500 text-sm mt-1">{errors.fechaFin.message}</p>
                    )}
                  </div>
                )}

                {/* Mostrar información de cálculo automático */}
                {selectedLicenseType?.calculo_automatico_fecha_fin && (
                  <div className="flex items-center justify-center">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-700">
                          Fecha fin se calcula automáticamente
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Campos de cantidad según el tipo de licencia */}
            {selectedLicenseType?.categoria === 'HORAS' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Horas
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max={Math.floor(availableQuantity)}
                    step="1"
                    placeholder="0"
                    {...register('horas', { 
                      min: { value: 0, message: 'Mínimo 0 horas' },
                      max: { value: Math.floor(availableQuantity), message: `Máximo ${Math.floor(availableQuantity)} horas` },
                      validate: (value) => {
                        const minutos = watch('minutos') || 0;
                        if (value === 0 && minutos === 0) {
                          return 'Debe ingresar al menos 1 hora o 1 minuto';
                        }
                        return true;
                      }
                    })}
                  />
                  {errors.horas && (
                    <p className="text-red-500 text-sm mt-1">{errors.horas.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Minutos
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    step="1"
                    placeholder="0"
                    {...register('minutos', { 
                      min: { value: 0, message: 'Mínimo 0 minutos' },
                      max: { value: 59, message: 'Máximo 59 minutos' },
                      validate: (value) => {
                        const horas = watch('horas') || 0;
                        if (value === 0 && horas === 0) {
                          return 'Debe ingresar al menos 1 hora o 1 minuto';
                        }
                        return true;
                      }
                    })}
                  />
                  {errors.minutos && (
                    <p className="text-red-500 text-sm mt-1">{errors.minutos.message}</p>
                  )}
                </div>
              </div>
            )}

            {selectedLicenseType?.categoria === 'DIAS' && !selectedLicenseType?.calculo_automatico_fecha_fin && (
              <div className="mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cantidad de días *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max={availableQuantity}
                    step="1"
                    placeholder="1"
                    {...register('cantidad', { 
                      required: 'Cantidad es requerida',
                      min: { value: 1, message: 'Mínimo 1 día' },
                      max: { value: availableQuantity, message: `Máximo ${availableQuantity} días` }
                    })}
                  />
                  {errors.cantidad && (
                    <p className="text-red-500 text-sm mt-1">{errors.cantidad.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Mostrar cantidad calculada automáticamente para licencias con cálculo automático */}
            {selectedLicenseType?.calculo_automatico_fecha_fin && watchedFechaInicio && watchedFechaFin && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700">
                    Cantidad calculada automáticamente: {calcularCantidadAutomatica({
                      fechaInicio: watchedFechaInicio,
                      fechaFin: watchedFechaFin
                    } as NewLicenseFormData)} días
                  </span>
                </div>
              </div>
            )}

            {/* NO mostrar campo cantidad para OCASIÓN - se calcula automáticamente */}

            {/* Mostrar período según el tipo de licencia */}
            {selectedLicenseType?.codigo === 'CT15' ? (
              watchedFechaNoTrabajara && watchedFechaSiTrabajara && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium text-purple-700">
                      Cambio de turno: No trabaja {formatInputDate(watchedFechaNoTrabajara)} → Trabaja {formatInputDate(watchedFechaSiTrabajara)}
                    </span>
                  </div>
                </div>
              )
            ) : selectedLicenseType?.codigo === 'OM14' ? (
              watchedFechaOlvido && watchedTipoOlvido && (
                <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm font-medium text-indigo-700">
                      Olvido de marcación: {formatInputDate(watchedFechaOlvido)} - {watchedTipoOlvido === 'entrada' ? 'Entrada' : 'Salida'}
                    </span>
                  </div>
                  {watchedJustificacionOlvido && (
                    <div className="mt-2 text-sm text-indigo-600">
                      <strong>Justificación:</strong> {watchedJustificacionOlvido}
                    </div>
                  )}
                </div>
              )
            ) : (
              watchedFechaInicio && watchedFechaFin && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700">
                      Período: {formatInputDate(watchedFechaInicio)} - {formatInputDate(watchedFechaFin)}
                    </span>
                  </div>
                  {(selectedLicenseType?.categoria === 'OCASION' || selectedLicenseType?.calculo_automatico_fecha_fin) && (
                    <div className="mt-2 text-sm text-blue-600">
                      <strong>Días calculados automáticamente:</strong> {calcularCantidadAutomatica({ fechaInicio: watchedFechaInicio, fechaFin: watchedFechaFin } as NewLicenseFormData)} días
                    </div>
                  )}
                </div>
              )
            )}

            {/* Mostrar cantidad total calculada para HORAS */}
            {(watchedHoras || watchedMinutos) && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700">
                    Tiempo total: {formatTimeTotal(watchedHoras || 0, watchedMinutos || 0)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Motivo y observaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Información Adicional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Motivo de la licencia *
                </label>
                <textarea
                  {...register('motivo', { required: 'Motivo es requerido' })}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describa el motivo de la licencia..."
                />
                {errors.motivo && (
                  <p className="text-red-500 text-sm mt-1">{errors.motivo.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Observaciones (opcional)
                </label>
                <textarea
                  {...register('observaciones')}
                  rows={2}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Observaciones adicionales..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/employees/${employeeId}/availability`)}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="flex items-center space-x-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isSubmitting ? 'Creando...' : 'Crear Licencia'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
