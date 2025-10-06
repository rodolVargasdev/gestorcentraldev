import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Employee, type SearchFilters, type SortOptions } from '../types/index';
import { EmployeeService } from '../services/employeeService';

interface EmployeeState {
  // Estado de los datos
  employees: Employee[];

  currentEmployee: Employee | null;
  loading: boolean;
  error: string | null;
  
  // Estado de paginación
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  
  // Estado de filtros y búsqueda
  filters: SearchFilters;
  sortOptions: SortOptions;
  
  // Estado de formularios
  isFormOpen: boolean;
  isEditing: boolean;
}

interface EmployeeActions {
  // Acciones de carga de datos
  loadEmployees: (page?: number, filters?: SearchFilters, sort?: SortOptions) => Promise<void>;
  loadAllEmployees: () => Promise<void>;
  loadEmployeeById: (id: string) => Promise<void>;

  refreshEmployees: () => Promise<void>;
  
  // Acciones CRUD
  createEmployee: (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  importEmployees: (employeesData: Array<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<{ success: number; total: number; failed: number }>;
  updateEmployee: (id: string, updates: Partial<Omit<Employee, 'id' | 'createdAt'>>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  
  // Acciones de búsqueda
  searchEmployees: (searchTerm: string) => Promise<void>;
  getActiveEmployees: () => Promise<void>;
  getEmployeesByDepartment: (departmentId: string) => Promise<void>;
  
  // Acciones de UI
  setCurrentEmployee: (employee: Employee | null) => void;
  openForm: (employee?: Employee) => void;
  closeForm: () => void;
  setFilters: (filters: SearchFilters) => void;
  setSortOptions: (sort: SortOptions) => void;
  setPage: (page: number) => void;
  
  // Acciones de estado
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type EmployeeStore = EmployeeState & EmployeeActions;

const initialState: EmployeeState = {
  employees: [],

  currentEmployee: null,
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 0,
  totalItems: 0,
  pageSize: 50,
  filters: {},
  sortOptions: { field: 'firstName', direction: 'asc' },
  isFormOpen: false,
  isEditing: false,
};

export const useEmployeeStore = create<EmployeeStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Acciones de carga de datos
      loadEmployees: async (page = 1, filters = get().filters, sort = get().sortOptions) => {
        try {
          set({ loading: true, error: null });
          
          console.log('🔍 DEBUG EmployeeStore.loadEmployees:');
          console.log('- Página solicitada:', page);
          console.log('- Filtros:', filters);
          console.log('- Ordenamiento:', sort);
          console.log('- Tamaño de página del store:', get().pageSize);
          
          const response = await EmployeeService.getEmployees(
            page,
            get().pageSize,
            filters,
            sort
          );
          
          console.log('🔍 DEBUG EmployeeStore - Respuesta recibida:');
          console.log('- Empleados recibidos:', response.data.length);
          console.log('- Página actual:', response.page);
          console.log('- Total de páginas:', response.totalPages);
          console.log('- Total de empleados:', response.total);
          
          set({
            employees: response.data,
            currentPage: response.page,
            totalPages: response.totalPages,
            totalItems: response.total,
            loading: false,
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          console.error('❌ ERROR EmployeeStore.loadEmployees:', errorMessage);
          set({
            error: errorMessage || 'Error al cargar empleados',
            loading: false,
          });
        }
      },

      loadAllEmployees: async () => {
        try {
          set({ loading: true, error: null });
          
          console.log('🔍 DEBUG EmployeeStore.loadAllEmployees: Cargando todos los empleados...');
          const allEmployees = await EmployeeService.getAllEmployees();
          
          console.log('🔍 DEBUG EmployeeStore.loadAllEmployees - Respuesta recibida:');
          console.log('- Empleados recibidos:', allEmployees.length);
          
          set({
            employees: allEmployees,
            currentPage: 1,
            totalPages: 1,
            totalItems: allEmployees.length,
            loading: false,
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          console.error('❌ ERROR EmployeeStore.loadAllEmployees:', errorMessage);
          set({
            error: errorMessage || 'Error al cargar todos los empleados',
            loading: false,
          });
        }
      },

      loadEmployeeById: async (id: string) => {
        try {
          set({ loading: true, error: null });
          
          const employee = await EmployeeService.getEmployeeById(id);
          
          set({
            currentEmployee: employee,
            loading: false,
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          set({
            error: errorMessage || 'Error al cargar empleado',
            loading: false,
          });
        }
      },



      refreshEmployees: async () => {
        await get().loadAllEmployees();
      },

      // Acciones CRUD
      createEmployee: async (employeeData) => {
        try {
          set({ loading: true, error: null });
          
          console.log('🔍 DEBUG EmployeeStore.createEmployee: Creando empleado...');
          const newEmployee = await EmployeeService.createEmployee(employeeData);
          console.log('✅ DEBUG EmployeeStore.createEmployee: Empleado creado:', newEmployee.id);
          
          // Actualización inteligente: solo agregar el nuevo empleado
          const currentEmployees = get().employees;
          set({
            employees: [...currentEmployees, newEmployee],
            totalItems: currentEmployees.length + 1,
            loading: false,
            isFormOpen: false,
            isEditing: false,
          });
          
          console.log('✅ DEBUG EmployeeStore.createEmployee: Lista actualizada, total empleados:', get().employees.length);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          console.error('❌ ERROR EmployeeStore.createEmployee:', errorMessage);
          set({
            error: errorMessage || 'Error al crear empleado',
            loading: false,
          });
        }
      },

      // Importar múltiples empleados
      importEmployees: async (employeesData: Array<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>) => {
        try {
          set({ loading: true, error: null });
          
          const createdEmployees: Employee[] = [];
          const failedEmployees: Array<{ employeeId: string; error: string }> = [];
          
          console.log(`🔄 Iniciando importación de ${employeesData.length} empleados...`);
          
          // Procesar en lotes para importaciones grandes
          const batchSize = employeesData.length > 100 ? 25 : 50;
          const totalBatches = Math.ceil(employeesData.length / batchSize);
          
          for (let i = 0; i < employeesData.length; i += batchSize) {
            const batch = employeesData.slice(i, i + batchSize);
            const currentBatch = Math.floor(i / batchSize) + 1;
            
            console.log(`📦 Procesando lote ${currentBatch}/${totalBatches} (${batch.length} empleados)`);
            
            for (const employeeData of batch) {
            try {
              console.log(`📝 Creando empleado: ${employeeData.employeeId} - ${employeeData.firstName} ${employeeData.lastName}`);
              const newEmployee = await EmployeeService.createEmployee(employeeData);
              createdEmployees.push(newEmployee);
              console.log(`✅ Empleado creado exitosamente: ${newEmployee.employeeId}`);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
              console.error(`❌ Error creando empleado ${employeeData.employeeId}:`, errorMessage);
              failedEmployees.push({
                employeeId: employeeData.employeeId,
                error: errorMessage
              });
              // Continuar con el siguiente empleado
            }
            }
            
            // Pausa entre lotes para evitar sobrecarga
            if (i + batchSize < employeesData.length) {
              console.log(`⏳ Pausa entre lotes...`);
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }
          
          console.log(`📊 Importación completada: ${createdEmployees.length} exitosos, ${failedEmployees.length} fallidos`);
          
          // Actualización inteligente: solo agregar los empleados nuevos
          const currentEmployees = get().employees;
          set({
            employees: [...currentEmployees, ...createdEmployees],
            totalItems: currentEmployees.length + createdEmployees.length,
            loading: false,
          });
          
          console.log('✅ DEBUG EmployeeStore.importEmployees: Lista actualizada, total empleados:', get().employees.length);
          
          return {
            success: createdEmployees.length,
            total: employeesData.length,
            failed: failedEmployees.length,
            failedDetails: failedEmployees
          };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          set({
            error: errorMessage || 'Error al importar empleados',
            loading: false,
          });
          throw error;
        }
      },

      updateEmployee: async (id: string, updates) => {
        try {
          set({ loading: true, error: null });
          
          const updatedEmployee = await EmployeeService.updateEmployee(id, updates);
          
          // Actualización inteligente: solo actualizar el empleado específico
          const currentEmployees = get().employees;
          const updatedEmployees = currentEmployees.map(emp => 
            emp.id === id ? { ...emp, ...updatedEmployee } : emp
          );
          
          set({
            employees: updatedEmployees,
            loading: false,
            isFormOpen: false,
            isEditing: false,
          });
          
          // Recargar solo el empleado específico para detalles
          await get().loadEmployeeById(id);
          
          console.log('✅ DEBUG EmployeeStore.updateEmployee: Empleado actualizado:', id);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          set({
            error: errorMessage || 'Error al actualizar empleado',
            loading: false,
          });
        }
      },

      deleteEmployee: async (id: string) => {
        try {
          set({ loading: true, error: null });
          
          await EmployeeService.deleteEmployee(id);
          
          // Actualización inteligente: solo remover el empleado específico
          const currentEmployees = get().employees;
          const filteredEmployees = currentEmployees.filter(emp => emp.id !== id);
          
          set({
            employees: filteredEmployees,
            totalItems: filteredEmployees.length,
            loading: false,
            currentEmployee: null,
          });
          
          console.log('✅ DEBUG EmployeeStore.deleteEmployee: Empleado eliminado:', id, 'Total empleados:', filteredEmployees.length);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          set({
            error: errorMessage || 'Error al eliminar empleado',
            loading: false,
          });
        }
      },

      // Acciones de búsqueda
      searchEmployees: async (searchTerm: string) => {
        try {
          set({ loading: true, error: null });
          
          const results = await EmployeeService.searchEmployees(searchTerm);
          
          set({
            employees: results,
            loading: false,
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          set({
            error: errorMessage || 'Error al buscar empleados',
            loading: false,
          });
        }
      },

      getActiveEmployees: async () => {
        try {
          set({ loading: true, error: null });
          
          const results = await EmployeeService.getActiveEmployees();
          
          set({
            employees: results,
            loading: false,
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          set({
            error: errorMessage || 'Error al obtener empleados activos',
            loading: false,
          });
        }
      },

      getEmployeesByDepartment: async (departmentId: string) => {
        try {
          set({ loading: true, error: null });
          
          const results = await EmployeeService.getEmployeesByDepartment(departmentId);
          
          set({
            employees: results,
            loading: false,
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          set({
            error: errorMessage || 'Error al obtener empleados por departamento',
            loading: false,
          });
        }
      },

      // Acciones de UI
      setCurrentEmployee: (employee) => {
        set({ currentEmployee: employee });
      },

      openForm: (employee) => {
        set({
          isFormOpen: true,
          isEditing: !!employee,
          currentEmployee: employee || null,
        });
      },

      closeForm: () => {
        set({
          isFormOpen: false,
          isEditing: false,
          currentEmployee: null,
        });
      },

      setFilters: (filters) => {
        set({ filters, currentPage: 1 });
        get().loadEmployees(1, filters);
      },

      setSortOptions: (sort) => {
        set({ sortOptions: sort });
        get().loadEmployees(1, get().filters, sort);
      },

      setPage: (page) => {
        set({ currentPage: page });
        get().loadEmployees(page);
      },

      // Acciones de estado
      setLoading: (loading) => {
        set({ loading });
      },

      setError: (error) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'employee-store',
      partialize: (state) => ({
        filters: state.filters,
        sortOptions: state.sortOptions,
        pageSize: state.pageSize,
      }),
    }
  )
);
