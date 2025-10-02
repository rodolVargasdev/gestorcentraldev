import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { 
  ArrowLeft, 
  RefreshCw, 
  Calendar, 
  Clock, 
  Users, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  FileText,
  BarChart3
} from 'lucide-react';
import { useLicenseStore } from '../stores/licenseStore';
import { useEmployeeStore } from '../stores/employeeStore';
import { type LicenciaHora, type LicenciaDia, type LicenciaOcasion } from '../types/index';
import { formatDateForElSalvador } from '../utils/dateUtils';

export function EmployeeAvailabilityPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'horas' | 'dias' | 'ocasion'>('horas');
  const [resetEnabled, setResetEnabled] = useState(false);

  const {
    employeeAvailability,
    loading,
    error,
    isRenewing,
    loadEmployeeAvailability,
    initializeEmployeeAvailability,
    renewAnnualAvailability,
    renewMonthlyAvailability,
    clearError
  } = useLicenseStore();

  const { currentEmployee, loadEmployeeById } = useEmployeeStore();

  useEffect(() => {
    if (employeeId) {
      loadEmployeeById(employeeId);
      loadEmployeeAvailability(employeeId);
    }
  }, [employeeId, loadEmployeeById, loadEmployeeAvailability]);

  const handleInitializeAvailability = async () => {
    if (employeeId) {
      await initializeEmployeeAvailability(employeeId);
    }
  };

  const handleRenewAnnual = async () => {
    if (employeeId) {
      await renewAnnualAvailability(employeeId);
    }
  };

  const handleRenewMonthly = async () => {
    if (employeeId) {
      await renewMonthlyAvailability(employeeId);
    }
  };

  // Funciones para limpiar disponibilidad (comentadas por ahora)
  // const handleCleanMonthlyOcasion = async () => {
  //   if (employeeId) {
  //     await cleanMonthlyOcasionAvailability(employeeId);
  //   }
  // };

  // const handleCleanMG07 = async () => {
  //   if (employeeId) {
  //     await cleanMG07Availability(employeeId);
  //   }
  // };

  const handleEnableReset = () => {
    setResetEnabled(true);
  };

  const handleNewLicense = () => {
    if (employeeId) {
      navigate(`/employees/${employeeId}/new-license`);
    }
  };

  const handleViewHistory = () => {
    if (employeeId) {
      navigate(`/employees/${employeeId}/license-history`);
    }
  };

  // Formatear fecha usando utilidades de El Salvador
  const formatDate = (date: unknown): string => {
    return formatDateForElSalvador(date);
  };

  const getStatusColor = (disponible: number, _utilizada: number, asignada: number) => {
    if (disponible === 0) return 'destructive';
    if (disponible <= asignada * 0.2) return 'destructive';
    if (disponible <= asignada * 0.5) return 'secondary';
    return 'default';
  };

  const getStatusIcon = (disponible: number, _utilizada: number, asignada: number) => {
    if (disponible === 0) return <XCircle className="h-4 w-4" />;
    if (disponible <= asignada * 0.2) return <AlertCircle className="h-4 w-4" />;
    if (disponible <= asignada * 0.5) return <AlertCircle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Cargando disponibilidad...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error al cargar disponibilidad</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={clearError}>Reintentar</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!employeeAvailability) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay disponibilidad configurada</h3>
            <p className="text-gray-600 mb-4">
              Este empleado no tiene disponibilidad de licencias configurada.
            </p>
            <Button onClick={handleInitializeAvailability}>
              Inicializar Disponibilidad
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Filtrar visibilidad para empleados de servicio profesional: solo OM14 y CT15
  const isProfessional = currentEmployee?.isProfessionalService === true;

  const horasAll = Object.values(employeeAvailability.licencias_horas || {});
  const diasAll = Object.values(employeeAvailability.licencias_dias || {});
  const ocasionAll = Object.values(employeeAvailability.licencias_ocasion || {});

  const horasLicencias = isProfessional ? [] : horasAll;
  const diasLicencias = isProfessional ? [] : diasAll;
  const ocasionLicencias = isProfessional
    ? ocasionAll.filter((l: LicenciaOcasion) => l.codigo === 'OM14' || l.codigo === 'CT15')
    : ocasionAll;

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/employees')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Disponibilidad de Licencias
            </h1>
            <p className="text-gray-600">
              {currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : 'Empleado'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewHistory}
          >
            <FileText className="h-4 w-4 mr-2" />
            Historial
          </Button>
          <Button
            onClick={handleNewLicense}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Licencia
          </Button>
        </div>
      </div>

      {/* Información del empleado */}
      {currentEmployee && (
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
      )}

      {/* Controles de renovación */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5" />
            <span>Controles de Renovación</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Año actual: {employeeAvailability.año_actual}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Mes actual: {employeeAvailability.mes_actual}</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRenewAnnual}
              disabled={isRenewing || !resetEnabled}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRenewing ? 'animate-spin' : ''}`} />
              Renovar Anual
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRenewMonthly}
              disabled={isRenewing || !resetEnabled}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRenewing ? 'animate-spin' : ''}`} />
              Renovar Mensual
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEnableReset}
              disabled={resetEnabled}
              className="bg-red-100 text-red-700 hover:bg-red-200 border-red-300"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Activar reseteo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de categorías */}
      <div className="flex space-x-1 mb-6">
        <Button
          variant={activeTab === 'horas' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('horas')}
        >
          <Clock className="h-4 w-4 mr-2" />
          Por Horas ({horasLicencias.length})
        </Button>
        <Button
          variant={activeTab === 'dias' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('dias')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Por Días ({diasLicencias.length})
        </Button>
        <Button
          variant={activeTab === 'ocasion' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('ocasion')}
        >
          <Users className="h-4 w-4 mr-2" />
          Por Ocasión ({ocasionLicencias.length})
        </Button>
      </div>

      {/* Contenido de las tabs */}
      <div className="space-y-4">
        {activeTab === 'horas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {horasLicencias.map((licencia: LicenciaHora) => (
              <Card key={licencia.codigo}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {licencia.nombre}
                    </CardTitle>
                    {getStatusIcon(licencia.disponible_anual || 0, licencia.utilizada_anual || 0, licencia.asignada_anual || 0)}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {licencia.codigo}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Asignada:</span>
                      <span className="font-medium">{licencia.asignada_anual || 0} {licencia.unidad}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Utilizada:</span>
                      <span className="font-medium text-red-600">{licencia.utilizada_anual || 0} {licencia.unidad}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Disponible:</span>
                      <Badge 
                        variant={getStatusColor(licencia.disponible_anual || 0, licencia.utilizada_anual || 0, licencia.asignada_anual || 0)}
                        className="font-medium"
                      >
                        {licencia.disponible_anual || 0} {licencia.unidad}
                      </Badge>
                    </div>
                    {licencia.periodo_control === 'anual' && (
                      <div className="text-xs text-gray-500">
                        Período: {formatDate(licencia.fecha_inicio_periodo)} - {formatDate(licencia.fecha_fin_periodo)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'dias' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {diasLicencias.map((licencia: LicenciaDia) => (
              <Card key={licencia.codigo}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {licencia.nombre}
                    </CardTitle>
                    {getStatusIcon(licencia.disponible_anual || 0, licencia.utilizada_anual || 0, licencia.asignada_anual || 0)}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {licencia.codigo}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {licencia.periodo_control === 'anual' && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>Asignada Anual:</span>
                          <span className="font-medium">{licencia.asignada_anual || 0} {licencia.unidad}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Utilizada Anual:</span>
                          <span className="font-medium text-red-600">{licencia.utilizada_anual || 0} {licencia.unidad}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Disponible Anual:</span>
                          <Badge 
                            variant={getStatusColor(licencia.disponible_anual || 0, licencia.utilizada_anual || 0, licencia.asignada_anual || 0)}
                            className="font-medium"
                          >
                            {licencia.disponible_anual || 0} {licencia.unidad}
                          </Badge>
                        </div>
                      </>
                    )}
                    {licencia.periodo_control === 'mensual' && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>Asignada Mensual:</span>
                          <span className="font-medium">{licencia.asignada_mensual || 0} {licencia.unidad}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Utilizada Mes Actual:</span>
                          <span className="font-medium text-red-600">{licencia.utilizada_mes_actual || 0} {licencia.unidad}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Disponible Mes Actual:</span>
                          <Badge 
                            variant={getStatusColor(licencia.disponible_mes_actual || 0, licencia.utilizada_mes_actual || 0, licencia.asignada_mensual || 0)}
                            className="font-medium"
                          >
                            {licencia.disponible_mes_actual || 0} {licencia.unidad}
                          </Badge>
                        </div>
                      </>
                    )}
                    {licencia.codigo === 'MG07' && (
                      <>
                        <Separator />
                        <div className="flex justify-between text-sm">
                          <span>Asignada por Embarazo:</span>
                          <span className="font-medium">{licencia.asignada_por_embarazo || 0} {licencia.unidad}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Utilizada Embarazo:</span>
                          <span className="font-medium text-red-600">{licencia.utilizada_embarazo_actual || 0} {licencia.unidad}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Disponible Embarazo:</span>
                          <Badge 
                            variant={getStatusColor(licencia.disponible_embarazo_actual || 0, licencia.utilizada_embarazo_actual || 0, licencia.asignada_por_embarazo || 0)}
                            className="font-medium"
                          >
                            {licencia.disponible_embarazo_actual || 0} {licencia.unidad}
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'ocasion' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ocasionLicencias.map((licencia: LicenciaOcasion) => (
              <Card key={licencia.codigo}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {licencia.nombre}
                    </CardTitle>
                    {licencia.periodo_control === 'mensual' ? (
                      getStatusIcon(licencia.disponible_mes_actual || 0, licencia.utilizada_mes_actual || 0, licencia.asignada_mensual || 0)
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {licencia.codigo}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {/* Información para licencias con control mensual (OM14, CT15) */}
                    {licencia.periodo_control === 'mensual' && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>Asignada Mensual:</span>
                          <span className="font-medium">{licencia.asignada_mensual || 0} {licencia.unidad}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Utilizada Mes Actual:</span>
                          <span className="font-medium text-red-600">{licencia.utilizada_mes_actual || 0} {licencia.unidad}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Disponible Mes Actual:</span>
                          <Badge 
                            variant={getStatusColor(licencia.disponible_mes_actual || 0, licencia.utilizada_mes_actual || 0, licencia.asignada_mensual || 0)}
                            className="font-medium"
                          >
                            {licencia.disponible_mes_actual || 0} {licencia.unidad}
                          </Badge>
                        </div>
                        <Separator />
                      </>
                    )}
                    
                    {/* Información general */}
                    <div className="flex justify-between text-sm">
                      <span>Máx. por Solicitud:</span>
                      <span className="font-medium">{licencia.max_por_solicitud || 'Sin límite'} {licencia.unidad}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Días Año:</span>
                      <span className="font-medium">{licencia.total_dias_año || 0} días</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Solicitudes Año:</span>
                      <span className="font-medium">{licencia.total_solicitudes_año || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Solicitudes Activas:</span>
                      <span className="font-medium">{licencia.solicitudes_activas?.length || 0}</span>
                    </div>
                    
                    {/* Mostrar historial mensual si existe */}
                    {licencia.uso_mensual && Object.keys(licencia.uso_mensual).length > 0 && (
                      <>
                        <Separator />
                        <div className="text-xs font-medium text-gray-600 mb-2">Historial Mensual:</div>
                        {Object.entries(licencia.uso_mensual)
                          .sort(([a], [b]) => b.localeCompare(a)) // Ordenar por fecha descendente
                          .slice(0, 3) // Mostrar solo los últimos 3 meses
                          .map(([monthKey, data]) => (
                            <div key={monthKey} className="text-xs text-gray-500">
                              <div className="flex justify-between">
                                <span>{monthKey}:</span>
                                <span>{data.utilizada}/{data.utilizada + data.disponible} {licencia.unidad}</span>
                              </div>
                            </div>
                          ))}
                      </>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Última actualización: {formatDate(licencia.ultima_actualizacion)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
