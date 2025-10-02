import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const sampleDepartments = [
  {
    name: 'Recursos Humanos',
    description: 'Departamento de gestión de personal y desarrollo organizacional',
    isActive: true,
  },
  {
    name: 'Tecnología de la Información',
    description: 'Departamento de sistemas y tecnología',
    isActive: true,
  },
  {
    name: 'Marketing',
    description: 'Departamento de marketing y comunicación',
    isActive: true,
  },
  {
    name: 'Finanzas',
    description: 'Departamento de finanzas y contabilidad',
    isActive: true,
  },
  {
    name: 'Operaciones',
    description: 'Departamento de operaciones y logística',
    isActive: true,
  },
  {
    name: 'Ventas',
    description: 'Departamento de ventas y atención al cliente',
    isActive: true,
  },
];

const sampleEmployees = [
  {
    employeeId: 'EMP001',
    firstName: 'María',
    lastName: 'González',
    email: 'maria.gonzalez@empresa.com',
    phone: '+503 7123-4567',
    position: 'Gerente de Recursos Humanos',
    hireDate: new Date('2020-03-15'),
    salary: 2500,
    currency: 'USD',
    isActive: true,
    gender: 'female',
    personalType: 'permanent',
    emergencyContact: {
      name: 'Carlos González',
      phone: '+503 7123-4568',
      relationship: 'Esposo',
    },
    address: {
      street: 'Calle Principal 123',
      city: 'San Salvador',
      state: 'San Salvador',
      zipCode: '1101',
      country: 'El Salvador',
    },
    notes: 'Empleada destacada con excelente gestión de personal',
    isProfessionalService: false, // No es de servicio profesional
  },
  {
    employeeId: 'EMP002',
    firstName: 'Juan',
    lastName: 'Rodríguez',
    email: 'juan.rodriguez@empresa.com',
    phone: '+503 7123-4569',
    position: 'Desarrollador Senior',
    hireDate: new Date('2019-07-20'),
    salary: 2800,
    currency: 'USD',
    isActive: true,
    gender: 'male',
    personalType: 'permanent',
    emergencyContact: {
      name: 'Ana Rodríguez',
      phone: '+503 7123-4570',
      relationship: 'Esposa',
    },
    address: {
      street: 'Avenida Reforma 456',
      city: 'San Salvador',
      state: 'San Salvador',
      zipCode: '1102',
      country: 'El Salvador',
    },
    notes: 'Desarrollador experto en React y Node.js',
    isProfessionalService: true, // Es de servicio profesional
  },
  {
    employeeId: 'EMP003',
    firstName: 'Carmen',
    lastName: 'Martínez',
    email: 'carmen.martinez@empresa.com',
    phone: '+503 7123-4571',
    position: 'Analista de Marketing',
    hireDate: new Date('2021-01-10'),
    salary: 1800,
    currency: 'USD',
    isActive: true,
    gender: 'female',
    personalType: 'permanent',
    emergencyContact: {
      name: 'Roberto Martínez',
      phone: '+503 7123-4572',
      relationship: 'Padre',
    },
    address: {
      street: 'Colonia Escalón 789',
      city: 'San Salvador',
      state: 'San Salvador',
      zipCode: '1103',
      country: 'El Salvador',
    },
    notes: 'Especialista en marketing digital',
    isProfessionalService: false, // No es de servicio profesional
  },
  {
    employeeId: 'EMP004',
    firstName: 'Carlos',
    lastName: 'López',
    email: 'carlos.lopez@empresa.com',
    phone: '+503 7123-4573',
    position: 'Contador Senior',
    hireDate: new Date('2018-11-05'),
    salary: 2200,
    currency: 'USD',
    isActive: true,
    gender: 'male',
    personalType: 'permanent',
    emergencyContact: {
      name: 'Sofia López',
      phone: '+503 7123-4574',
      relationship: 'Hermana',
    },
    address: {
      street: 'Residencial Las Palmas 321',
      city: 'San Salvador',
      state: 'San Salvador',
      zipCode: '1104',
      country: 'El Salvador',
    },
    notes: 'Contador certificado con 8 años de experiencia',
    isProfessionalService: true, // Es de servicio profesional
  },
  {
    employeeId: 'EMP005',
    firstName: 'Ana',
    lastName: 'Hernández',
    email: 'ana.hernandez@empresa.com',
    phone: '+503 7123-4575',
    position: 'Coordinadora de Operaciones',
    hireDate: new Date('2020-09-12'),
    salary: 2000,
    currency: 'USD',
    isActive: true,
    gender: 'female',
    personalType: 'permanent',
    emergencyContact: {
      name: 'Miguel Hernández',
      phone: '+503 7123-4576',
      relationship: 'Esposo',
    },
    address: {
      street: 'Colonia San Benito 654',
      city: 'San Salvador',
      state: 'San Salvador',
      zipCode: '1105',
      country: 'El Salvador',
    },
    notes: 'Coordinadora eficiente con excelente gestión de procesos',
    isProfessionalService: false, // No es de servicio profesional
  },
  {
    employeeId: 'EMP006',
    firstName: 'Roberto',
    lastName: 'Pérez',
    email: 'roberto.perez@empresa.com',
    phone: '+503 7123-4577',
    position: 'Representante de Ventas',
    hireDate: new Date('2021-06-18'),
    salary: 1600,
    currency: 'USD',
    isActive: true,
    gender: 'male',
    personalType: 'permanent',
    emergencyContact: {
      name: 'Elena Pérez',
      phone: '+503 7123-4578',
      relationship: 'Madre',
    },
    address: {
      street: 'Avenida Masferrer 987',
      city: 'San Salvador',
      state: 'San Salvador',
      zipCode: '1106',
      country: 'El Salvador',
    },
    notes: 'Vendedor destacado con metas superadas',
    isProfessionalService: false, // No es de servicio profesional
  },
  {
    employeeId: 'EMP007',
    firstName: 'Patricia',
    lastName: 'Sánchez',
    email: 'patricia.sanchez@empresa.com',
    phone: '+503 7123-4579',
    position: 'Desarrolladora Frontend',
    hireDate: new Date('2022-02-28'),
    salary: 1900,
    currency: 'USD',
    isActive: true,
    gender: 'female',
    personalType: 'contract',
    emergencyContact: {
      name: 'Luis Sánchez',
      phone: '+503 7123-4580',
      relationship: 'Hermano',
    },
    address: {
      street: 'Colonia Miramonte 147',
      city: 'San Salvador',
      state: 'San Salvador',
      zipCode: '1107',
      country: 'El Salvador',
    },
    notes: 'Desarrolladora especializada en React y TypeScript',
    isProfessionalService: true, // Es de servicio profesional
  },
  {
    employeeId: 'EMP008',
    firstName: 'Fernando',
    lastName: 'Díaz',
    email: 'fernando.diaz@empresa.com',
    phone: '+503 7123-4581',
    position: 'Analista Financiero',
    hireDate: new Date('2021-08-15'),
    salary: 2100,
    currency: 'USD',
    isActive: true,
    gender: 'male',
    personalType: 'permanent',
    emergencyContact: {
      name: 'Isabel Díaz',
      phone: '+503 7123-4582',
      relationship: 'Esposa',
    },
    address: {
      street: 'Residencial Los Héroes 258',
      city: 'San Salvador',
      state: 'San Salvador',
      zipCode: '1108',
      country: 'El Salvador',
    },
    notes: 'Analista con experiencia en finanzas corporativas',
    isProfessionalService: true, // Es de servicio profesional
  },
  {
    employeeId: 'EMP009',
    firstName: 'Lucía',
    lastName: 'Morales',
    email: 'lucia.morales@empresa.com',
    phone: '+503 7123-4583',
    position: 'Asistente Administrativa',
    hireDate: new Date('2022-04-10'),
    salary: 1200,
    currency: 'USD',
    isActive: true,
    gender: 'female',
    personalType: 'temporary',
    emergencyContact: {
      name: 'José Morales',
      phone: '+503 7123-4584',
      relationship: 'Padre',
    },
    address: {
      street: 'Colonia Centroamérica 369',
      city: 'San Salvador',
      state: 'San Salvador',
      zipCode: '1109',
      country: 'El Salvador',
    },
    notes: 'Asistente eficiente y organizada',
    isProfessionalService: false, // No es de servicio profesional
  },
  {
    employeeId: 'EMP010',
    firstName: 'Diego',
    lastName: 'Castro',
    email: 'diego.castro@empresa.com',
    phone: '+503 7123-4585',
    position: 'Técnico de Soporte',
    hireDate: new Date('2021-12-03'),
    salary: 1400,
    currency: 'USD',
    isActive: true,
    gender: 'male',
    personalType: 'permanent',
    emergencyContact: {
      name: 'Rosa Castro',
      phone: '+503 7123-4586',
      relationship: 'Madre',
    },
    address: {
      street: 'Avenida Independencia 741',
      city: 'San Salvador',
      state: 'San Salvador',
      zipCode: '1110',
      country: 'El Salvador',
    },
    notes: 'Técnico especializado en hardware y software',
    isProfessionalService: true, // Es de servicio profesional
  },
];

export async function initializeDepartments() {
  console.log('🏢 Inicializando departamentos...');
  
  try {
    // Verificar si ya existen departamentos
    const existingDepartments = await checkDepartmentsExist();
    if (existingDepartments) {
      console.log('✅ Los departamentos ya existen en la base de datos');
      return;
    }

    // Crear cada departamento
    for (const dept of sampleDepartments) {
      try {
        await addDoc(collection(db, 'departments'), {
          ...dept,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        console.log(`✅ Departamento creado: ${dept.name}`);
      } catch (error) {
        console.error(`❌ Error al crear departamento ${dept.name}:`, error);
      }
    }

    console.log('🎉 Todos los departamentos han sido inicializados exitosamente');
    
  } catch (error) {
    console.error('❌ Error al inicializar departamentos:', error);
    throw error;
  }
}

export async function initializeEmployees() {
  console.log('👥 Inicializando empleados...');
  
  try {
    // Verificar si ya existen empleados
    const existingEmployees = await checkEmployeesExist();
    if (existingEmployees) {
      console.log('✅ Los empleados ya existen en la base de datos');
      return;
    }

    // Obtener departamentos para asignar
    const departmentsSnapshot = await getDocs(collection(db, 'departments'));
    const departments = departmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (departments.length === 0) {
      console.log('⚠️ No hay departamentos disponibles. Creando departamentos primero...');
      await initializeDepartments();
      const newDepartmentsSnapshot = await getDocs(collection(db, 'departments'));
      departments.push(...newDepartmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    }

    // Crear cada empleado
    for (let i = 0; i < sampleEmployees.length; i++) {
      const emp = sampleEmployees[i];
      try {
        // Asignar departamento de forma rotativa
        const departmentIndex = i % departments.length;
        const departmentId = departments[departmentIndex].id;

        await addDoc(collection(db, 'employees'), {
          ...emp,
          departmentId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        console.log(`✅ Empleado creado: ${emp.firstName} ${emp.lastName} - ${emp.position}`);
      } catch (error) {
        console.error(`❌ Error al crear empleado ${emp.firstName} ${emp.lastName}:`, error);
      }
    }

    console.log('🎉 Todos los empleados han sido inicializados exitosamente');
    console.log(`📊 Total de empleados creados: ${sampleEmployees.length}`);
    
  } catch (error) {
    console.error('❌ Error al inicializar empleados:', error);
    throw error;
  }
}

export async function checkDepartmentsExist(): Promise<boolean> {
  try {
    const departmentsRef = collection(db, 'departments');
    const snapshot = await getDocs(departmentsRef);
    return !snapshot.empty;
  } catch (error) {
    console.error('❌ Error al verificar departamentos existentes:', error);
    return false;
  }
}

export async function checkEmployeesExist(): Promise<boolean> {
  try {
    const employeesRef = collection(db, 'employees');
    const snapshot = await getDocs(employeesRef);
    return !snapshot.empty;
  } catch (error) {
    console.error('❌ Error al verificar empleados existentes:', error);
    return false;
  }
}

// Función para obtener empleados por departamento
export async function getEmployeesByDepartment(departmentId: string) {
  try {
    const employeesRef = collection(db, 'employees');
    const q = query(employeesRef, where('departmentId', '==', departmentId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Error al obtener empleados por departamento:', error);
    throw error;
  }
}

// Función para obtener empleados por género
export async function getEmployeesByGender(gender: 'male' | 'female') {
  try {
    const employeesRef = collection(db, 'employees');
    const q = query(employeesRef, where('gender', '==', gender));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Error al obtener empleados por género:', error);
    throw error;
  }
}

// Función para obtener empleados por tipo de personal
export async function getEmployeesByPersonalType(personalType: 'permanent' | 'temporary' | 'contract') {
  try {
    const employeesRef = collection(db, 'employees');
    const q = query(employeesRef, where('personalType', '==', personalType));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Error al obtener empleados por tipo de personal:', error);
    throw error;
  }
}
