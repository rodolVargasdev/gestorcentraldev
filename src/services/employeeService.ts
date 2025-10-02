import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Query,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { type Employee, type SearchFilters, type SortOptions, type PaginatedResponse } from '../types/index';

export class EmployeeService {
  private static collectionName = 'employees';


  // ===== EMPLEADOS =====

  // Obtener todos los empleados
  static async getAllEmployees(): Promise<Employee[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      return querySnapshot.docs.map(doc => this.mapDocumentToEmployee(doc));
    } catch (error) {
      console.error('Error getting employees:', error);
      throw new Error('Error al obtener empleados');
    }
  }

  // Obtener empleados con paginación y filtros
  static async getEmployees(
    page: number = 1,
    pageSize: number = 10,
    filters?: SearchFilters,
    sort?: SortOptions
  ): Promise<PaginatedResponse<Employee>> {
    try {
      let q: Query<DocumentData, DocumentData> = collection(db, this.collectionName);

      // Aplicar filtros
      if (filters?.department) {
        q = query(q, where('department', '==', filters.department));
      }
      if (filters?.status) {
        q = query(q, where('isActive', '==', filters.status === 'active'));
      }
      if (filters?.search) {
        // Búsqueda por nombre o email
        q = query(
          q,
          where('firstName', '>=', filters.search),
          where('firstName', '<=', filters.search + '\uf8ff')
        );
      }

      // Aplicar ordenamiento
      if (sort) {
        q = query(q, orderBy(sort.field, sort.direction));
      } else {
        q = query(q, orderBy('firstName', 'asc'));
      }

      // Aplicar paginación
      q = query(q, limit(pageSize));

      const querySnapshot = await getDocs(q);
      const employees = querySnapshot.docs.map(doc => this.mapDocumentToEmployee(doc));

      // Obtener total de documentos
      const totalSnapshot = await getDocs(collection(db, this.collectionName));
      const total = totalSnapshot.size;

      return {
        data: employees,
        total: total,
        page: page,
        pageSize: pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      console.error('Error getting employees with pagination:', error);
      throw new Error('Error al obtener empleados');
    }
  }

  // Obtener un empleado por ID
  static async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return this.mapDocumentToEmployee(docSnap);
      }

      return null;
    } catch (error) {
      console.error('Error getting employee by ID:', error);
      throw new Error('Error al obtener empleado');
    }
  }

  // Obtener empleado por email
  static async getEmployeeByEmail(email: string): Promise<Employee | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('email', '==', email)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return this.mapDocumentToEmployee(querySnapshot.docs[0]);
      }

      return null;
    } catch (error) {
      console.error('Error getting employee by email:', error);
      throw new Error('Error al obtener empleado por email');
    }
  }

  // Crear un nuevo empleado
  static async createEmployee(employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...employeeData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const newDoc = await getDoc(docRef);
      if (!newDoc.exists()) {
        throw new Error('Error al crear empleado');
      }
      
      const newEmployee = this.mapDocumentToEmployee(newDoc as any);
      
      // Inicializar disponibilidad automáticamente
      try {
        const { LicenseService } = await import('./licenseService');
        await LicenseService.initializeEmployeeAvailability(newEmployee.id);
        console.log('✅ Disponibilidad inicializada automáticamente para:', newEmployee.firstName, newEmployee.lastName);
      } catch (availabilityError) {
        console.warn('⚠️ No se pudo inicializar disponibilidad automáticamente:', availabilityError);
        // No fallar la creación del empleado si la disponibilidad falla
      }
      
      return newEmployee;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw new Error('Error al crear empleado');
    }
  }

  // Actualizar un empleado
  static async updateEmployee(id: string, updates: Partial<Omit<Employee, 'id' | 'createdAt'>>): Promise<Employee> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      const updatedDoc = await getDoc(docRef);
      if (!updatedDoc.exists()) {
        throw new Error('Error al actualizar empleado');
      }
      return this.mapDocumentToEmployee(updatedDoc as any);
    } catch (error) {
      console.error('Error updating employee:', error);
      throw new Error('Error al actualizar empleado');
    }
  }

  // Eliminar un empleado
  static async deleteEmployee(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw new Error('Error al eliminar empleado');
    }
  }

  // Buscar empleados por nombre
  static async searchEmployees(searchTerm: string): Promise<Employee[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('firstName', '>=', searchTerm),
        where('firstName', '<=', searchTerm + '\uf8ff'),
        orderBy('firstName')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.mapDocumentToEmployee(doc));
    } catch (error) {
      console.error('Error searching employees:', error);
      throw new Error('Error al buscar empleados');
    }
  }

  // Obtener empleados activos
  static async getActiveEmployees(): Promise<Employee[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('isActive', '==', true),
        orderBy('firstName')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.mapDocumentToEmployee(doc));
    } catch (error) {
      console.error('Error getting active employees:', error);
      throw new Error('Error al obtener empleados activos');
    }
  }

  // Obtener empleados por departamento
  static async getEmployeesByDepartment(departmentId: string): Promise<Employee[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('departmentId', '==', departmentId),
        where('isActive', '==', true),
        orderBy('firstName')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.mapDocumentToEmployee(doc));
    } catch (error) {
      console.error('Error getting employees by department:', error);
      throw new Error('Error al obtener empleados por departamento');
    }
  }

  // Verificar si existe un empleado con el mismo email
  static async checkEmployeeEmailExists(email: string, excludeId?: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('email', '==', email)
      );

      const querySnapshot = await getDocs(q);
      
      if (excludeId) {
        return querySnapshot.docs.some(doc => doc.id !== excludeId);
      }

      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking employee email exists:', error);
      throw new Error('Error al verificar email de empleado');
    }
  }

  // Obtener estadísticas de empleados
  static async getEmployeeStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byDepartment: Record<string, number>;
  }> {
    try {
      const allEmployees = await this.getAllEmployees();
      
      const stats = {
        total: allEmployees.length,
        active: allEmployees.filter(emp => emp.isActive).length,
        inactive: allEmployees.filter(emp => !emp.isActive).length,
        byDepartment: {} as Record<string, number>,
      };

      // Contar por departamento
      allEmployees.forEach(employee => {
        stats.byDepartment[employee.department] = (stats.byDepartment[employee.department] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting employee stats:', error);
      throw new Error('Error al obtener estadísticas de empleados');
    }
  }



  // ===== MÉTODOS PRIVADOS =====

  // Mapear documento de Firestore a objeto Employee
  private static mapDocumentToEmployee(doc: QueryDocumentSnapshot<DocumentData>): Employee {
    const data = doc.data();
    return {
      id: doc.id,
      employeeId: data.employeeId,
      userId: data.userId,
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
      isProfessionalService: data.isProfessionalService || false, // Por defecto false
      isActive: data.isActive,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
    };
  }


}
