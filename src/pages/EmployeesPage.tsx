import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ImportEmployeesModal } from '../components/employees/ImportEmployeesModal';
import { ExportEmployeesModal } from '../components/employees/ExportEmployeesModal';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  Users,
  Building,
  Calendar,
  Mail,
  Filter,
  Search,
  UserPlus,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Upload,
  Download,
  Plus,
  BarChart3,
  RotateCcw,
  RefreshCw
} from 'lucide-react';
import { useEmployeeStore } from '../stores/employeeStore';
import { useLicenseStore } from '../stores/licenseStore';







// Departamentos de ejemplo
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

export const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [employeesPerPage, setEmployeesPerPage] = useState(50);
  const [showAll, setShowAll] = useState(false);

  // Estado para los modales
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Estados para operaciones de reset
  const [resettingMonthly, setResettingMonthly] = useState(false);
  const [resettingAnnual, setResettingAnnual] = useState(false);

  // Obtener datos del store de Firebase
  const { employees, loading, loadEmployees, deleteEmployee, importEmployees } = useEmployeeStore();
  const { resetAllAnnualAvailability, resetAllMonthlyAvailability } = useLicenseStore();


  // Cargar datos reales de Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadEmployees();
      } catch (error) {
        console.error('Error cargando empleados:', error);
      }
    };

    loadData();
  }, [loadEmployees]);

  const filteredEmployees = employees.filter(employee => {
    const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
    const employeeId = employee.employeeId.toLowerCase();
    const email = employee.email.toLowerCase();
    const position = employee.position.toLowerCase();
    
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         employeeId.includes(searchTerm.toLowerCase()) ||
                         email.includes(searchTerm.toLowerCase()) ||
                         position.includes(searchTerm.toLowerCase());
    
    const matchesDepartment = filterDepartment === 'all' || employee.department === filterDepartment;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && employee.isActive) || 
      (filterStatus === 'inactive' && !employee.isActive);

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // Calcular paginación
  const indexOfLastEmployee = showAll ? filteredEmployees.length : currentPage * employeesPerPage;
  const indexOfFirstEmployee = showAll ? 0 : indexOfLastEmployee - employeesPerPage;
  const currentEmployees = showAll ? filteredEmployees : filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
  const totalPages = showAll ? 1 : Math.ceil(filteredEmployees.length / employeesPerPage);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDepartment, filterStatus, employeesPerPage, showAll]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'inactive': return <UserX className="h-4 w-4 text-red-600" />;
      case 'on_leave': return <Calendar className="h-4 w-4 text-yellow-600" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'on_leave': return 'En Licencia';
      default: return status;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'on_leave': return 'outline';
      default: return 'default';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-GT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const handleCreateNew = () => {
    navigate('/employees/new');
  };



  const getExistingEmployeesForValidation = () => {
    return employees.map(emp => ({
      employeeId: emp.employeeId,
      email: emp.email
    }));
  };

  const handleEdit = (id: string) => {
    navigate(`/employees/edit/${id}`);
  };

  const handleView = (id: string) => {
    navigate(`/employees/view/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este empleado?')) {
      try {
        await deleteEmployee(id);
        alert('Empleado eliminado exitosamente');
      } catch (error) {
        console.error('Error eliminando empleado:', error);
        alert('Error al eliminar empleado. Por favor, inténtalo de nuevo.');
      }
    }
  };

  const handleNewLicense = (employeeId: string) => {
    navigate(`/employees/${employeeId}/new-license`);
  };

  const handleViewAvailability = (employeeId: string) => {
    navigate(`/employees/${employeeId}/availability`);
  };

  // Funciones de reset de disponibilidad
  const handleResetMonthlyAvailability = async () => {
    const confirmed = confirm(
      `¿Estás seguro de que quieres resetear la disponibilidad MENSUAL de TODOS los empleados?\n\n` +
      `Esta acción:\n` +
      `• Reseteará los permisos mensuales (OM14, CT15) para todos los empleados\n` +
      `• Restaurará los contadores mensuales a sus valores iniciales\n` +
      `• Es irreversible\n\n` +
      `¿Continuar?`
    );

    if (!confirmed) return;

    setResettingMonthly(true);

    try {
      console.log('🔄 Iniciando reset mensual masivo de disponibilidad...');

      const result = await resetAllMonthlyAvailability();

      // Recargar empleados para mostrar cambios
      await loadEmployees();

      alert(`Reset mensual completado:\n✅ ${result.success} empleados actualizados\n❌ ${result.failed} errores`);

    } catch (error) {
      console.error('Error general en reset mensual:', error);
      alert('Error durante el reset mensual. Revisa la consola para más detalles.');
    } finally {
      setResettingMonthly(false);
    }
  };

  const handleResetAnnualAvailability = async () => {
    const confirmed = confirm(
      `¿Estás seguro de que quieres resetear la disponibilidad ANUAL de TODOS los empleados?\n\n` +
      `Esta acción:\n` +
      `• Reseteará los permisos anuales (PG01, PS02, GG05, VG11, VGA12) para todos los empleados\n` +
      `• Restaurará los contadores anuales a sus valores iniciales\n` +
      `• Para VGA12: acumulará días restantes hasta el límite de 90\n` +
      `• Es irreversible\n\n` +
      `¿Continuar?`
    );

    if (!confirmed) return;

    setResettingAnnual(true);

    try {
      console.log('🔄 Iniciando reset anual masivo de disponibilidad...');

      const result = await resetAllAnnualAvailability();

      // Recargar empleados para mostrar cambios
      await loadEmployees();

      alert(`Reset anual completado:\n✅ ${result.success} empleados actualizados\n❌ ${result.failed} errores`);

    } catch (error) {
      console.error('Error general en reset anual:', error);
      alert('Error durante el reset anual. Revisa la consola para más detalles.');
    } finally {
      setResettingAnnual(false);
    }
  };

  const handleImportEmployees = async (importedEmployees: any[]) => {
    try {
      console.log(`🔄 Iniciando importación de ${importedEmployees.length} empleados...`);
      
      // Mapear los datos importados al formato correcto
      const mappedEmployees = importedEmployees.map(emp => ({
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: '',
        position: emp.position,
        department: emp.department,
        employeeType: emp.employeeType,
        hireDate: new Date(emp.hireDate),
        salary: 0,
        gender: emp.gender,
        birthDate: new Date(),
        address: '',
        personalType: 'full-time' as const,
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        isActive: true
      }));

      const result = await importEmployees(mappedEmployees);
      console.log(`📊 Importación completada: ${result.success} exitosos, ${result.failed} fallidos`);
      
      // ✅ LA DISPONIBILIDAD SE INICIALIZA AUTOMÁTICAMENTE EN createEmployee
      // No necesitamos inicialización adicional porque ya está integrada
      if (result.success > 0) {
        console.log('✅ Disponibilidad inicializada automáticamente para todos los empleados importados');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error en la importación:', error);
      throw error;
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Botón "Primera página"
    if (startPage > 1) {
      buttons.push(
        <Button
          key="first"
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1)}
          className="px-2"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      );
    }

    // Botón "Anterior"
    if (currentPage > 1) {
      buttons.push(
        <Button
          key="prev"
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      );
    }

    // Números de página
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={i === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(i)}
          className="px-3"
        >
          {i}
        </Button>
      );
    }

    // Botón "Siguiente"
    if (currentPage < totalPages) {
      buttons.push(
        <Button
          key="next"
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      );
    }

    // Botón "Última página"
    if (endPage < totalPages) {
      buttons.push(
        <Button
          key="last"
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          className="px-2"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      );
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando empleados...</p>
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
                onClick={() => navigate('/dashboard')}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Gestión de Empleados
                </h1>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowImportModal(true)}
                className="flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Importar</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowExportModal(true)}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </Button>
              <Button
                onClick={() => navigate('/employees/new')}
                className="bg-green-600 hover:bg-green-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Empleado
              </Button>
              <Button
                variant="outline"
                onClick={handleResetMonthlyAvailability}
                disabled={resettingMonthly || resettingAnnual}
                className="flex items-center space-x-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                title="Resetear disponibilidad mensual para todos los empleados"
              >
                {resettingMonthly ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                <span>Reset Mensual</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleResetAnnualAvailability}
                disabled={resettingMonthly || resettingAnnual}
                className="flex items-center space-x-2 border-red-300 text-red-700 hover:bg-red-50"
                title="Resetear disponibilidad anual para todos los empleados"
              >
                {resettingAnnual ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                <span>Reset Anual</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employees.length.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Empleados registrados
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activos</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {employees.filter(e => e.isActive).length.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Empleados activos
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Licencia</CardTitle>
                <Calendar className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {employees.filter(e => !e.isActive).length.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  En permiso temporal
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Departamentos</CardTitle>
                <Building className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(employees.map(e => e.department)).size}
                </div>
                <p className="text-xs text-muted-foreground">
                  Departamentos activos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filtros</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, ID, email o cargo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departamento
                  </label>
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="all">Todos los departamentos</option>
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                    <option value="on_leave">En Licencia</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Info */}
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Mostrando {indexOfFirstEmployee + 1} a {Math.min(indexOfLastEmployee, filteredEmployees.length)} de {filteredEmployees.length.toLocaleString()} empleados
            </div>
            <div className="flex items-center space-x-4">
              {/* Controles de paginación */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Mostrar:</label>
                <select
                  value={showAll ? 'all' : employeesPerPage.toString()}
                  onChange={(e) => {
                    if (e.target.value === 'all') {
                      setShowAll(true);
                      setCurrentPage(1);
                    } else {
                      setShowAll(false);
                      setEmployeesPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }
                  }}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="50">50 por página</option>
                  <option value="100">100 por página</option>
                  <option value="all">Todos</option>
                </select>
              </div>
              
              {!showAll && (
                <div className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </div>
              )}
            </div>
          </div>

          {/* Employees Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {currentEmployees.map((employee) => (
              <Card key={employee.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          {employee.employeeId}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(employee.isActive ? 'active' : 'inactive')}>
                          {getStatusLabel(employee.isActive ? 'active' : 'inactive')}
                        </Badge>
                        {employee.isProfessionalService && (
                          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200" title="Servicio profesional">
                            SP
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">
                        {employee.firstName} {employee.lastName}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {employee.position}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{employee.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{employee.department}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Contratado: {formatDate(employee.hireDate)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(employee.id)}
                        title="Ver detalles del empleado"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleNewLicense(employee.id)}
                        title="Crear nueva licencia"
                        className="text-green-600 hover:text-green-700"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAvailability(employee.id)}
                        title="Ver disponibilidad de licencias"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(employee.id)}
                        title="Editar empleado"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(employee.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Eliminar empleado"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">
                      {getStatusIcon(employee.isActive ? 'active' : 'inactive')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {!showAll && totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mb-8">
              {renderPaginationButtons()}
            </div>
          )}

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron empleados
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterDepartment !== 'all' || filterStatus !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda.'
                  : 'Aún no hay empleados registrados.'}
              </p>
              <Button onClick={handleCreateNew}>
                <UserPlus className="h-4 w-4 mr-2" />
                Registrar primer empleado
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Importación */}
      <ImportEmployeesModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportEmployees}
        existingEmployees={getExistingEmployeesForValidation()}
      />

      {/* Modal de Exportación */}
      <ExportEmployeesModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        employees={employees}
        departments={DEPARTMENTS}
      />
    </div>
  );
};
