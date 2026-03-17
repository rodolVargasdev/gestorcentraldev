import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Header } from '../components/layout/Header';
import { 
  Users, 
  FileText, 
  BarChart3, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle
} from 'lucide-react';
import { useEmployeeStore } from '../stores/employeeStore';

export function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Array<{
    title: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
  }>>([
    {
      title: 'Total Empleados',
      value: '0',
      change: '0%',
      changeType: 'neutral',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Empleados Activos',
      value: '0',
      change: '0%',
      changeType: 'neutral',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Empleados Inactivos',
      value: '0',
      change: '0%',
      changeType: 'neutral',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Departamentos',
      value: '0',
      change: '0',
      changeType: 'neutral',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]);

  // Obtener datos de los stores
  const { employees, loadAllEmployees } = useEmployeeStore();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Cargar datos reales
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        console.log('🔍 DASHBOARD DEBUG - Cargando todos los empleados...');
        await loadAllEmployees();
        console.log('🔍 DASHBOARD DEBUG - Empleados cargados:', employees.length);
      } catch (error) {
        console.error('❌ ERROR DASHBOARD - Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [loadAllEmployees]);

  // Calcular estadísticas en tiempo real
  useEffect(() => {
    if (!loading) {
      // Debug: Log de datos recibidos
      console.log('🔍 DASHBOARD DEBUG - Datos recibidos:');
      console.log('Empleados:', employees.length, employees);
      console.log('🔍 DASHBOARD DEBUG - Comparación con página de empleados:');
      console.log('- Total empleados en dashboard:', employees.length);

      // Empleados activos
      const activeEmployees = employees.filter(emp => emp.isActive).length;
      
      // Empleados inactivos
      const inactiveEmployees = employees.filter(emp => !emp.isActive).length;
      
      // Departamentos únicos
      const uniqueDepartments = new Set(employees.map(emp => emp.department)).size;

      console.log('🔍 DASHBOARD DEBUG - Cálculos:');
      console.log('Empleados activos:', activeEmployees);
      console.log('Empleados inactivos:', inactiveEmployees);
      console.log('Departamentos únicos:', uniqueDepartments);

      setStats([
        {
          title: 'Total Empleados',
          value: employees.length.toString(),
          change: '0%',
          changeType: 'neutral',
          icon: Users,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        },
        {
          title: 'Empleados Activos',
          value: activeEmployees.toString(),
          change: '0%',
          changeType: activeEmployees > 0 ? 'positive' : 'neutral',
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        },
        {
          title: 'Empleados Inactivos',
          value: inactiveEmployees.toString(),
          change: '0%',
          changeType: inactiveEmployees > 0 ? 'negative' : 'neutral',
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        },
        {
          title: 'Departamentos',
          value: uniqueDepartments.toString(),
          change: '0',
          changeType: 'neutral',
          icon: FileText,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50'
        }
      ]);
    }
  }, [employees, loading]);

  const quickActions = [
    {
      title: 'Empleados',
      description: 'Ver lista de empleados',
      icon: Users,
      action: () => handleNavigation('/employees'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Nuevo Empleado',
      description: 'Agregar nuevo empleado',
      icon: Plus,
      action: () => handleNavigation('/employees/new'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Reportes',
      description: 'Generar reportes',
      icon: BarChart3,
      action: () => handleNavigation('/reports'),
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  // Generar actividad reciente basada en empleados
  const generateRecentActivity = () => {
    if (!employees.length) {
      return [];
    }

    // Obtener los últimos 5 empleados ordenados por fecha de creación
    const recentEmployees = employees
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return recentEmployees.map((employee, index) => {
      const getTimeAgo = (date: Date) => {
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Hace menos de 1 hora';
        if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
        
        return `Hace ${Math.floor(diffInDays / 7)} semana${Math.floor(diffInDays / 7) > 1 ? 's' : ''}`;
      };

      return {
        id: index + 1,
        employee: `${employee.firstName} ${employee.lastName}`,
        action: 'Empleado registrado',
        department: employee.department,
        time: getTimeAgo(new Date(employee.createdAt)),
        status: employee.isActive ? 'active' : 'inactive'
      };
    });
  };

  const recentActivity = generateRecentActivity();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Dashboard" 
        subtitle="Bienvenido al sistema de gestión de empleados" 
      />



      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className={`text-sm ${
                      stat.changeType === 'positive' ? 'text-green-600' : 
                      stat.changeType === 'negative' ? 'text-red-600' : 
                      'text-gray-500'
                    }`}>
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={action.action}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${action.color} text-white`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-gray-600">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Actividad Reciente</span>
              </CardTitle>
              <CardDescription>
                Últimos empleados registrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      {getStatusIcon(activity.status)}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.employee}</p>
                        <p className="text-sm text-gray-600">{activity.action} - {activity.department}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay actividad reciente</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Resumen</span>
              </CardTitle>
              <CardDescription>
                Información general del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-900 font-medium">Total de Empleados</span>
                  <span className="text-blue-900 font-bold">{employees.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-900 font-medium">Empleados Activos</span>
                  <span className="text-green-900 font-bold">
                    {employees.filter(emp => emp.isActive).length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-purple-900 font-medium">Departamentos</span>
                  <span className="text-purple-900 font-bold">
                    {new Set(employees.map(emp => emp.department)).size}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
