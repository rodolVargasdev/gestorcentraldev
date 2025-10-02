import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft, 
  Edit, 
  Trash2,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  AlertCircle,
  Eye
} from 'lucide-react';
import { useEmployeeStore } from '../stores/employeeStore';

export const ViewEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { employees, deleteEmployee } = useEmployeeStore();

  // Cargar datos del empleado
  useEffect(() => {
    if (id) {
      const foundEmployee = employees.find(emp => emp.id === id);
      if (foundEmployee) {
        setEmployee(foundEmployee);
      } else {
        setNotFound(true);
      }
    }
  }, [id, employees]);

  const handleDelete = async () => {
    if (!id) return;

    try {
      await deleteEmployee(id);
      alert('Empleado eliminado exitosamente');
      navigate('/employees');
    } catch (error) {
      console.error('Error eliminando empleado:', error);
      alert('Error al eliminar empleado. Por favor, inténtalo de nuevo.');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(amount);
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male': return 'Masculino';
      case 'female': return 'Femenino';
      case 'other': return 'Otro';
      default: return gender;
    }
  };

  const getEmployeeTypeLabel = (type: string) => {
    switch (type) {
      case 'operativo': return 'Operativo';
      case 'administrativo': return 'Administrativo';
      default: return type;
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <AlertCircle className="h-6 w-6" />
              <h2 className="text-xl font-semibold">Empleado no encontrado</h2>
            </div>
            <p className="text-gray-600 mb-4">
              El empleado que buscas no existe o ha sido eliminado.
            </p>
            <Button onClick={() => navigate('/employees')} className="w-full">
              Volver a Empleados
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando empleado...</p>
        </div>
      </div>
    );
  }

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
                <Eye className="h-6 w-6 text-purple-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Detalles del Empleado
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => navigate(`/employees/edit/${id}`)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Información Básica</span>
              </CardTitle>
              <CardDescription>
                Datos personales y de identificación del empleado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">ID de Empleado</h3>
                  <p className="text-lg font-semibold text-gray-900">{employee.employeeId}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Estado</h3>
                  <Badge variant={employee.isActive ? "default" : "secondary"}>
                    {employee.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Nombre Completo</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {employee.firstName} {employee.lastName}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Género</h3>
                  <p className="text-gray-900">{getGenderLabel(employee.gender)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a 
                      href={`mailto:${employee.email}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {employee.email}
                    </a>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Teléfono</h3>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">
                      {employee.phone || 'No especificado'}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Fecha de Nacimiento</h3>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">
                      {employee.birthDate ? formatDate(employee.birthDate) : 'No especificada'}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Fecha de Contratación</h3>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{formatDate(employee.hireDate)}</span>
                  </div>
                </div>
              </div>
              {employee.address && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Dirección</h3>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-900">{employee.address}</span>
                  </div>
                </div>
              )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Departamento</h3>
                  <p className="text-lg font-semibold text-gray-900">{employee.department}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Puesto</h3>
                  <p className="text-lg font-semibold text-gray-900">{employee.position}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Tipo de Empleado</h3>
                  <Badge variant="outline">
                    {getEmployeeTypeLabel(employee.employeeType)}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Tipo de Personal</h3>
                  <Badge variant="outline">
                    {employee.personalType === 'full-time' ? 'Tiempo Completo' : 
                     employee.personalType === 'part-time' ? 'Tiempo Parcial' :
                     employee.personalType === 'contractor' ? 'Contratista' :
                     employee.personalType === 'intern' ? 'Pasante' : employee.personalType}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Salario</h3>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-lg font-semibold text-gray-900">
                      {employee.salary ? formatCurrency(employee.salary) : 'No especificado'}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Servicio Profesional</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      employee.isProfessionalService
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {employee.isProfessionalService ? 'Sí' : 'No'}
                    </span>
                    {employee.isProfessionalService && (
                      <span className="text-xs text-gray-500">
                        Solo OM14 y CT15
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contacto de Emergencia */}
          {employee.emergencyContact && (
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Nombre</h3>
                    <p className="text-gray-900">
                      {employee.emergencyContact.name || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Teléfono</h3>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">
                        {employee.emergencyContact.phone || 'No especificado'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Relación</h3>
                    <p className="text-gray-900">
                      {employee.emergencyContact.relationship || 'No especificada'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información del Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Información del Sistema</span>
              </CardTitle>
              <CardDescription>
                Metadatos del registro del empleado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Fecha de Creación</h3>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{formatDate(employee.createdAt)}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Última Actualización</h3>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{formatDate(employee.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                <span>Confirmar Eliminación</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                ¿Estás seguro de que quieres eliminar al empleado{' '}
                <strong>{employee.firstName} {employee.lastName}</strong>?
              </p>
              <p className="text-sm text-red-600">
                Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
