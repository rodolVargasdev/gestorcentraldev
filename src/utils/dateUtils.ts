// ========================================
// UTILIDADES DE FECHAS PARA LICENCIAS
// ========================================

import { addDays, addMonths, differenceInDays } from 'date-fns';

/**
 * Calcular días entre dos fechas (por calendario)
 * @param fechaInicio - Fecha de inicio
 * @param fechaFin - Fecha de fin
 * @returns Número de días por calendario
 */
export function calcularDiasCalendario(fechaInicio: Date, fechaFin: Date): number {
  return differenceInDays(fechaFin, fechaInicio) + 1; // +1 para incluir ambos días
}

/**
 * Calcular fecha fin automática para maternidad (112 días)
 * @param fechaInicio - Fecha de inicio del embarazo
 * @returns Fecha fin calculada automáticamente
 */
export function calcularFechaFinMaternidad(fechaInicio: Date): Date {
  return addDays(fechaInicio, 111); // 112 días totales (inicio + 111 días más)
}

/**
 * Calcular fecha fin automática para lactancia (6 meses)
 * @param fechaInicio - Fecha de inicio de la lactancia
 * @returns Fecha fin calculada automáticamente
 */
export function calcularFechaFinLactancia(fechaInicio: Date): Date {
  return addMonths(fechaInicio, 6);
}

/**
 * Verificar si hay solapamiento de fechas
 * @param fechaInicio - Nueva fecha de inicio
 * @param fechaFin - Nueva fecha de fin
 * @param fechasExistentes - Array de fechas existentes
 * @returns true si hay solapamiento
 */
export function haySolapamientoFechas(
  fechaInicio: Date,
  fechaFin: Date,
  fechasExistentes: Array<{ fechaInicio: Date; fechaFin: Date }>
): boolean {
  return fechasExistentes.some(existente => {
    return (
      (fechaInicio >= existente.fechaInicio && fechaInicio <= existente.fechaFin) ||
      (fechaFin >= existente.fechaInicio && fechaFin <= existente.fechaFin) ||
      (fechaInicio <= existente.fechaInicio && fechaFin >= existente.fechaFin)
    );
  });
}

// ========================================
// UTILIDADES DE FECHA PARA EL SALVADOR
// ========================================

// Zona horaria de El Salvador (UTC-6)
export const EL_SALVADOR_TIMEZONE = 'America/El_Salvador';

// Obtener fecha actual en zona horaria de El Salvador
export function getCurrentDateInElSalvador(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: EL_SALVADOR_TIMEZONE }));
}

/**
 * Formatear fecha para mostrar
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-SV', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Validar que una fecha sea válida
 */
export function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

// Convertir fecha a zona horaria de El Salvador
export function convertToElSalvadorTime(date: Date): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: EL_SALVADOR_TIMEZONE }));
}

// Formatear fecha en formato local de El Salvador
export function formatDateForElSalvador(date: Date | string | unknown): string {
  if (!date) return 'N/A';
  
  try {
    let dateObj: Date;
    
    // Si es un objeto Firestore Timestamp
    if (date && typeof date === 'object' && 'toDate' in date) {
      const timestamp = date as { toDate: () => Date };
      dateObj = timestamp.toDate();
    }
    // Si es un objeto con seconds (Timestamp sin toDate)
    else if (date && typeof date === 'object' && 'seconds' in date) {
      const timestamp = date as { seconds: number };
      dateObj = new Date(timestamp.seconds * 1000);
    }
    // Si es un Date
    else if (date instanceof Date) {
      dateObj = date;
    }
    // Si es un string
    else if (typeof date === 'string') {
      dateObj = new Date(date);
    }
    else {
      return 'N/A';
    }
    
    // Convertir a zona horaria de El Salvador y formatear
    return dateObj.toLocaleDateString('es-SV', {
      timeZone: EL_SALVADOR_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return 'N/A';
  }
}

// Formatear fecha y hora en formato local de El Salvador
export function formatDateTimeForElSalvador(date: Date | string | unknown): string {
  if (!date) return 'N/A';
  
  try {
    let dateObj: Date;
    
    // Si es un objeto Firestore Timestamp
    if (date && typeof date === 'object' && 'toDate' in date) {
      const timestamp = date as { toDate: () => Date };
      dateObj = timestamp.toDate();
    }
    // Si es un objeto con seconds (Timestamp sin toDate)
    else if (date && typeof date === 'object' && 'seconds' in date) {
      const timestamp = date as { seconds: number };
      dateObj = new Date(timestamp.seconds * 1000);
    }
    // Si es un Date
    else if (date instanceof Date) {
      dateObj = date;
    }
    // Si es un string
    else if (typeof date === 'string') {
      dateObj = new Date(date);
    }
    else {
      return 'N/A';
    }
    
    // Convertir a zona horaria de El Salvador y formatear
    return dateObj.toLocaleString('es-SV', {
      timeZone: EL_SALVADOR_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'N/A';
  }
}

// Obtener fecha de inicio del día en El Salvador
export function getStartOfDayInElSalvador(date: Date = new Date()): Date {
  const elSalvadorDate = new Date(date.toLocaleString('en-US', { timeZone: EL_SALVADOR_TIMEZONE }));
  elSalvadorDate.setHours(0, 0, 0, 0);
  return elSalvadorDate;
}

// Obtener fecha de fin del día en El Salvador
export function getEndOfDayInElSalvador(date: Date = new Date()): Date {
  const elSalvadorDate = new Date(date.toLocaleString('en-US', { timeZone: EL_SALVADOR_TIMEZONE }));
  elSalvadorDate.setHours(23, 59, 59, 999);
  return elSalvadorDate;
}

// Verificar si una fecha es hoy en El Salvador
export function isTodayInElSalvador(date: Date): boolean {
  const today = getStartOfDayInElSalvador();
  const checkDate = getStartOfDayInElSalvador(date);
  return today.getTime() === checkDate.getTime();
}

// Verificar si una fecha es en el futuro en El Salvador
export function isFutureDateInElSalvador(date: Date): boolean {
  const now = getCurrentDateInElSalvador();
  return date > now;
}

// Verificar si una fecha es en el pasado en El Salvador
export function isPastDateInElSalvador(date: Date): boolean {
  const now = getCurrentDateInElSalvador();
  return date < now;
}
