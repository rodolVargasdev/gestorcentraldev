// ========================================
// TIPOS PRINCIPALES DE LA APLICACIÓN
// ========================================

export interface User {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  photoURL?: string;
  role: 'super-admin' | 'admin' | 'manager' | 'viewer';
  department?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface Employee {
  id: string;
  employeeId: string;
  userId?: string; // ID del usuario de Firebase Auth
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  employeeType: 'operativo' | 'administrativo';
  hireDate: Date;
  salary?: number;
  personalType: 'full-time' | 'part-time' | 'contractor' | 'intern';
  gender: 'male' | 'female' | 'other';
  birthDate: Date;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  isProfessionalService?: boolean; // Indica si es de servicio profesional (solo OM14 y CT15)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // ========================================
  // DISPONIBILIDAD DE LICENCIAS
  // ========================================
  disponibilidad?: {
    año_actual: number;
    mes_actual: number;
    ultima_renovacion_anual: Date;
    ultima_renovacion_mensual: Date;
    
    // LICENCIAS POR HORAS
    licencias_horas: Record<string, LicenciaHora>;
    
    // LICENCIAS POR DÍAS
    licencias_dias: Record<string, LicenciaDia>;
    
    // LICENCIAS POR OCASIÓN
    licencias_ocasion: Record<string, LicenciaOcasion>;
  };
}

// ========================================
// INTERFACES DE DISPONIBILIDAD
// ========================================

export interface LicenciaHora {
  codigo: string;
  nombre: string;
  categoria: 'HORAS';
  periodo_control: 'anual' | 'ninguno' | 'mensual';
  asignada_anual?: number;
  utilizada_anual?: number;
  disponible_anual?: number;
  asignada_actual?: number;
  utilizada_actual?: number;
  disponible_actual?: number;
  unidad: string;
  aplica_genero?: 'M' | 'F';
  periodo_activo?: boolean;
  fecha_inicio_periodo?: Date;
  fecha_fin_periodo?: Date;
  // ✅ NUEVO: Historial anual para permisos retroactivos
  uso_anual?: Record<string, { utilizada: number; disponible: number; asignada: number }>;
  solicitudes_activas: string[];
  ultima_actualizacion: Date;
}

export interface LicenciaDia {
  codigo: string;
  nombre: string;
  categoria: 'DIAS';
  periodo_control: 'anual' | 'mensual' | 'ninguno';
  asignada_anual?: number;
  utilizada_anual?: number;
  disponible_anual?: number;
  asignada_mensual?: number;
  utilizada_mes_actual?: number;
  disponible_mes_actual?: number;
  asignada_por_embarazo?: number;
  utilizada_embarazo_actual?: number;
  disponible_embarazo_actual?: number;
  unidad: string;
  aplica_genero?: 'M' | 'F';
  embarazo_activo?: boolean;
  fecha_ultimo_embarazo?: Date;
  uso_mensual?: Record<string, { utilizada: number; disponible: number }>;
  // ✅ NUEVO: Historial anual para permisos retroactivos
  uso_anual?: Record<string, { utilizada: number; disponible: number; asignada: number }>;
  // ✅ NUEVO: Campos para permisos acumulativos (VGA12)
  acumulado_total?: number; // Días acumulados de años anteriores
  max_acumulacion?: number; // Máximo de días que se pueden acumular
  solicitudes_activas: string[];
  ultima_actualizacion: Date;
}

export interface LicenciaOcasion {
  codigo: string;
  nombre: string;
  categoria: 'OCASION';
  periodo_control: 'ninguno' | 'mensual';
  max_por_solicitud?: number;
  unidad: string;
  historial_uso: HistorialUso[];
  total_dias_año: number;
  total_solicitudes_año: number;
  // ✅ NUEVO: Campos para OM14 (Olvido de Marcación)
  asignada_mensual?: number;
  utilizada_mes_actual?: number;
  disponible_mes_actual?: number;
  uso_mensual?: Record<string, { utilizada: number; disponible: number }>;
  solicitudes_activas: string[];
  ultima_actualizacion: Date;
}

export interface HistorialUso {
  solicitud_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_utilizados: number;
  estado: 'APROBADA' | 'RECHAZADA' | 'PENDIENTE';
  motivo?: string;
}

// ========================================
// TIPOS PARA IMPORTACIÓN DE EMPLEADOS
// ========================================

export interface ImportEmployee {
  employeeId: string;
  fullName: string;
  email: string;
  position: string;
  department: string;
  hireDate: string;
}

// ========================================
// TIPOS PARA FORMULARIOS
// ========================================

export interface LoginForm {
  email: string;
  password: string;
}

// ========================================
// TIPOS PARA SOLICITUDES DE LICENCIAS
// ========================================
export interface LicenseRequest {
  id: string;
  employeeId: string;
  licenseTypeCode: string;
  licenseTypeName: string;
  startDate: Date;
  endDate: Date;
  quantity: number;
  reason: string;
  observations?: string;
  status: 'active' | 'cancelled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLicenseRequestData {
  employeeId: string;
  licenseTypeCode: string;
  startDate: Date;
  endDate: Date;
  quantity: number;
  reason: string;
  observations?: string;
}

// ========================================
// TIPOS PARA BÚSQUEDAS Y FILTROS
// ========================================

export interface SearchFilters {
  search?: string;
  searchTerm?: string;
  department?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  employeeId?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ========================================
// TIPOS BÁSICOS
// ========================================

export type Gender = 'male' | 'female' | 'other';
export type PersonalType = 'full-time' | 'part-time' | 'contractor' | 'intern';
