import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { 
  ArrowLeft, 
  Save, 
  UserPlus,
  Building,
  Phone,
  Users
} from 'lucide-react';
import { useEmployeeStore } from '../stores/employeeStore';

interface EmployeeFormData {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  employeeType: 'operativo' | 'administrativo';
  hireDate: string;
  salary: number;
  gender: 'male' | 'female' | 'other';
  birthDate: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  isProfessionalService: boolean;
}

const DEPARTMENTS = [
  'Tecnología',
  'Recursos Humanos',
  'Finanzas',
  'Ventas',
  'Marketing',
  'Operaciones',
  'Legal',
  'Administración'
];

const POSITIONS = [
  'Desarrollador',
  'Analista',
  'Gerente',
  'Director',
  'Asistente',
  'Coordinador',
  'Especialista',
  'Consultor'
];

export const NewEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { createEmployee, employees } = useEmployeeStore();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<EmployeeFormData>({
    defaultValues: {
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      employeeType: 'operativo',
      hireDate: new Date().toISOString().split('T')[0],
      salary: 0,
      gender: 'other',
      birthDate: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
      isProfessionalService: false
    }
  });

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      setLoading(true);
      
      // Validar duplicados
      const existingEmployeeId = employees.find(emp => emp.employeeId === data.employeeId);
      if (existingEmployeeId) {
        alert('Ya existe un empleado con este ID. Por favor, usa un ID diferente.');
        setLoading(false);
        return;
      }

      const existingEmail = employees.find(emp => emp.email === data.email);
      if (existingEmail) {
        alert('Ya existe un empleado con este email. Por favor, usa un email diferente.');
        setLoading(false);
        return;
      }

      const employeeData = {
        employeeId: data.employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || '',
        position: data.position,
        department: data.department,
        employeeType: data.employeeType,
        hireDate: new Date(data.hireDate),
        salary: data.salary || 0,
        isActive: true,
        isProfessionalService: !!data.isProfessionalService,
        gender: data.gender,
        birthDate: data.birthDate ? new Date(data.birthDate) : new Date(),
        address: data.address || '',
        personalType: 'full-time' as const,
        emergencyContact: {
          name: data.emergencyContactName || '',
          phone: data.emergencyContactPhone || '',
          relationship: data.emergencyContactRelationship || ''
        }
      };

      await createEmployee(employeeData);
      
      // Mostrar mensaje de éxito
      alert('Empleado creado exitosamente');
      navigate('/employees');
    } catch (error) {
      console.error('Error creando empleado:', error);
      alert('Error al crear empleado. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/employees')}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <UserPlus className="h-6 w-6 text-green-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Nuevo Empleado
                </h1>
              </div>
            </div>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar Empleado'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Información Básica</span>
                </CardTitle>
                <CardDescription>
                  Datos personales y de identificación del empleado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       ID de Empleado *
                     </label>
                     <Input
                       {...register('employeeId', { 
                         required: 'El ID de empleado es requerido',
                         minLength: { value: 3, message: 'Mínimo 3 caracteres' }
                       })}
                       placeholder="EMP001"
                       className={errors.employeeId ? 'border-red-500' : ''}
                     />
                     {errors.employeeId && (
                       <p className="text-red-500 text-sm mt-1">{errors.employeeId.message}</p>
                     )}
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Género *
                     </label>
                     <select
                       {...register('gender', { required: 'El género es requerido' })}
                       className={`w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 ${
                         errors.gender ? 'border-red-500' : ''
                       }`}
                     >
                       <option value="">Seleccionar género</option>
                       <option value="male">Masculino</option>
                       <option value="female">Femenino</option>
                       <option value="other">Otro</option>
                     </select>
                     {errors.gender && (
                       <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
                     )}
                   </div>
                 </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <Input
                      {...register('firstName', { 
                        required: 'El nombre es requerido',
                        minLength: { value: 2, message: 'Mínimo 2 caracteres' }
                      })}
                      placeholder="Juan"
                      className={errors.firstName ? 'border-red-500' : ''}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido *
                    </label>
                    <Input
                      {...register('lastName', { 
                        required: 'El apellido es requerido',
                        minLength: { value: 2, message: 'Mínimo 2 caracteres' }
                      })}
                      placeholder="Pérez"
                      className={errors.lastName ? 'border-red-500' : ''}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <Input
                      {...register('email', { 
                        required: 'El email es requerido',
                        pattern: { 
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 
                          message: 'Email inválido' 
                        }
                      })}
                      type="email"
                      placeholder="juan.perez@empresa.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <Input
                      {...register('phone')}
                      placeholder="+502 1234-5678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <Input
                    {...register('address')}
                    placeholder="Dirección completa"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Nacimiento
                    </label>
                    <Input
                      {...register('birthDate')}
                      type="date"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Contratación *
                    </label>
                    <Input
                      {...register('hireDate', { required: 'La fecha de contratación es requerida' })}
                      type="date"
                      className={errors.hireDate ? 'border-red-500' : ''}
                    />
                    {errors.hireDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.hireDate.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información Laboral */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Información Laboral</span>
                </CardTitle>
                <CardDescription>
                  Datos relacionados con el puesto y departamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Departamento *
                     </label>
                     <div className="relative">
                       <Input
                         {...register('department', { 
                           required: 'El departamento es requerido',
                           minLength: { value: 2, message: 'Mínimo 2 caracteres' }
                         })}
                         placeholder="Escribir o seleccionar departamento"
                         list="departments"
                         className={errors.department ? 'border-red-500' : ''}
                       />
                       <datalist id="departments">
                         {DEPARTMENTS.map(dept => (
                           <option key={dept} value={dept} />
                         ))}
                       </datalist>
                     </div>
                     {errors.department && (
                       <p className="text-red-500 text-sm mt-1">{errors.department.message}</p>
                     )}
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Puesto *
                     </label>
                     <div className="relative">
                       <Input
                         {...register('position', { 
                           required: 'El puesto es requerido',
                           minLength: { value: 2, message: 'Mínimo 2 caracteres' }
                         })}
                         placeholder="Escribir o seleccionar puesto"
                         list="positions"
                         className={errors.position ? 'border-red-500' : ''}
                       />
                       <datalist id="positions">
                         {POSITIONS.map(pos => (
                           <option key={pos} value={pos} />
                         ))}
                       </datalist>
                     </div>
                     {errors.position && (
                       <p className="text-red-500 text-sm mt-1">{errors.position.message}</p>
                     )}
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Tipo de Empleado *
                     </label>
                     <select
                       {...register('employeeType', { required: 'El tipo de empleado es requerido' })}
                       className={`w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 ${
                         errors.employeeType ? 'border-red-500' : ''
                       }`}
                     >
                       <option value="">Seleccionar tipo</option>
                       <option value="operativo">Operativo</option>
                       <option value="administrativo">Administrativo</option>
                     </select>
                     {errors.employeeType && (
                       <p className="text-red-500 text-sm mt-1">{errors.employeeType.message}</p>
                     )}
                   </div>
                 </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      {...register('isProfessionalService')}
                      className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-500 focus:ring-green-500"
                      required={true}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Es de servicio profesional
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Los empleados de servicio profesional solo pueden solicitar permisos de olvido de marcación y cambio de turno.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salario ($)
                  </label>
                  <Input
                    {...register('salary', { 
                      min: { value: 0, message: 'El salario no puede ser negativo' }
                    })}
                    type="number"
                    placeholder="5000"
                    className={errors.salary ? 'border-red-500' : ''}
                  />
                  {errors.salary && (
                    <p className="text-red-500 text-sm mt-1">{errors.salary.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contacto de Emergencia */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Contacto de Emergencia</span>
                </CardTitle>
                <CardDescription>
                  Información de contacto en caso de emergencia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre
                    </label>
                    <Input
                      {...register('emergencyContactName')}
                      placeholder="María Pérez"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <Input
                      {...register('emergencyContactPhone')}
                      placeholder="+502 1234-5678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relación
                    </label>
                    <Input
                      {...register('emergencyContactRelationship')}
                      placeholder="Esposa, Padre, etc."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botones de Acción */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/employees')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Guardando...' : 'Guardar Empleado'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
