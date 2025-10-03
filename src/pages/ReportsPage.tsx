import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployeeService } from '../services/employeeService';
import { LicenseService } from '../services/licenseService';
import { type Employee, type LicenseRequest } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface ReportData {
  employee: Employee;
  licenseRequests: LicenseRequest[];
  totalDays: number;
  totalHours: number;
}

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'), // 1 de enero del año actual
    endDate: format(new Date(), 'yyyy-MM-dd') // Fecha actual
  });
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set());

  // Cargar empleados
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const employeesData = await EmployeeService.getAllEmployees();
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error cargando empleados:', error);
      alert('Error cargando empleados');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar empleados por término de búsqueda
  const filteredEmployees = employees.filter(employee =>
    `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex);

  // Generar reporte individual
  const generateEmployeeReport = async (employee: Employee) => {
    try {
      setGeneratingReports(prev => new Set(prev).add(employee.id));
      
      console.log(`📊 Generando reporte para ${employee.firstName} ${employee.lastName}`);
      console.log(`📅 Rango de fechas: ${dateRange.startDate} - ${dateRange.endDate}`);

      // Obtener solicitudes de licencias en el rango de fechas
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      // Ajustar fechas para incluir todo el día
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const licenseRequests = await LicenseService.getLicenseRequestsByEmployeeAndDateRange(
        employee.id,
        startDate,
        endDate
      );

      // Filtrar solo solicitudes activas
      const activeRequests = licenseRequests.filter(request => request.status === 'active');

      console.log(`📋 Solicitudes encontradas: ${activeRequests.length}`);

      // Preparar datos del reporte
      const reportData: ReportData = {
        employee,
        licenseRequests: activeRequests,
        totalDays: activeRequests.reduce((total, request) => {
          const days = Math.ceil((request.endDate.getTime() - request.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          return total + days;
        }, 0),
        totalHours: activeRequests.reduce((total, request) => {
          // Para licencias por horas, usar la cantidad directamente
          if (request.licenseTypeCode === 'PG01' || request.licenseTypeCode === 'PS02') {
            return total + request.quantity;
          }
          return total;
        }, 0)
      };

      // Generar Excel
      await generateExcelReport(reportData);

    } catch (error) {
      console.error('Error generando reporte:', error);
      alert('Error generando reporte');
    } finally {
      setGeneratingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(employee.id);
        return newSet;
      });
    }
  };

  // Generar archivo Excel
  const generateExcelReport = async (reportData: ReportData) => {
    try {
      const { employee, licenseRequests, totalDays, totalHours } = reportData;

      // Crear hoja de resumen
      const summaryData = [
        ['REPORTE DE PERMISOS - RESUMEN'],
        [''],
        ['Empleado:', `${employee.firstName} ${employee.lastName}`],
        ['ID Empleado:', employee.employeeId],
        ['Departamento:', employee.department],
        ['Cargo:', employee.position],
        ['Período:', `${format(new Date(dateRange.startDate), 'dd/MM/yyyy', { locale: es })} - ${format(new Date(dateRange.endDate), 'dd/MM/yyyy', { locale: es })}`],
        ['Fecha de generación:', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })],
        [''],
        ['TOTALES'],
        ['Total de solicitudes:', licenseRequests.length],
        ['Total de días:', totalDays],
        ['Total de horas:', totalHours],
        [''],
        ['DETALLE DE SOLICITUDES']
      ];

      // Crear datos detallados
      const detailData = [
        ['Código', 'Tipo de Licencia', 'Fecha Inicio', 'Fecha Fin', 'Cantidad', 'Motivo', 'Estado', 'Fecha Solicitud']
      ];

      licenseRequests.forEach(request => {
        detailData.push([
          request.licenseTypeCode,
          request.licenseTypeName,
          format(request.startDate, 'dd/MM/yyyy', { locale: es }),
          format(request.endDate, 'dd/MM/yyyy', { locale: es }),
          request.quantity.toString(),
          request.reason,
          request.status === 'active' ? 'Activa' : request.status === 'cancelled' ? 'Cancelada' : 'Completada',
          format(request.createdAt, 'dd/MM/yyyy HH:mm', { locale: es })
        ]);
      });

      // Crear libro de Excel
      const workbook = XLSX.utils.book_new();
      
      // Hoja de resumen
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

      // Hoja de detalle
      const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
      XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detalle');

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 15 }, // Código
        { wch: 30 }, // Tipo de Licencia
        { wch: 12 }, // Fecha Inicio
        { wch: 12 }, // Fecha Fin
        { wch: 10 }, // Cantidad
        { wch: 40 }, // Motivo
        { wch: 12 }, // Estado
        { wch: 18 }  // Fecha Solicitud
      ];
      detailSheet['!cols'] = colWidths;

      // Generar archivo
      const fileName = `Reporte_${employee.firstName}_${employee.lastName}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      console.log(`✅ Reporte generado: ${fileName}`);
      alert(`Reporte generado exitosamente: ${fileName}`);

    } catch (error) {
      console.error('Error generando Excel:', error);
      alert('Error generando archivo Excel');
    }
  };

  // Generar reporte general (todos los empleados)
  const generateGeneralReport = async () => {
    try {
      setLoading(true);
      console.log('📊 Generando reporte general...');

      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // Obtener todas las solicitudes en el rango de fechas
      const allRequests = await LicenseService.getLicenseRequestsByDateRange(startDate, endDate);
      const activeRequests = allRequests.filter(request => request.status === 'active');

      // Agrupar por empleado
      const employeeReports = new Map<string, ReportData>();
      
      for (const request of activeRequests) {
        if (!employeeReports.has(request.employeeId)) {
          const employee = employees.find(emp => emp.id === request.employeeId);
          if (employee) {
            employeeReports.set(request.employeeId, {
              employee,
              licenseRequests: [],
              totalDays: 0,
              totalHours: 0
            });
          }
        }
        
        const report = employeeReports.get(request.employeeId);
        if (report) {
          report.licenseRequests.push(request);
          const days = Math.ceil((request.endDate.getTime() - request.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          report.totalDays += days;
          
          if (request.licenseTypeCode === 'PG01' || request.licenseTypeCode === 'PS02') {
            report.totalHours += request.quantity;
          }
        }
      }

      // Crear datos del reporte general
      const generalData = [
        ['REPORTE GENERAL DE PERMISOS'],
        [''],
        ['Período:', `${format(new Date(dateRange.startDate), 'dd/MM/yyyy', { locale: es })} - ${format(new Date(dateRange.endDate), 'dd/MM/yyyy', { locale: es })}`],
        ['Fecha de generación:', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })],
        ['Total de empleados con permisos:', employeeReports.size],
        ['Total de solicitudes:', activeRequests.length],
        [''],
        ['DETALLE POR EMPLEADO']
      ];

      const detailData = [
        ['Empleado', 'ID', 'Departamento', 'Cargo', 'Solicitudes', 'Total Días', 'Total Horas']
      ];

      for (const [, report] of employeeReports) {
        detailData.push([
          `${report.employee.firstName} ${report.employee.lastName}`,
          report.employee.employeeId,
          report.employee.department,
          report.employee.position,
          report.licenseRequests.length.toString(),
          report.totalDays.toString(),
          report.totalHours.toString()
        ]);
      }

      // Crear libro de Excel
      const workbook = XLSX.utils.book_new();
      
      const summarySheet = XLSX.utils.aoa_to_sheet(generalData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen General');

      const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
      XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detalle por Empleado');

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 25 }, // Empleado
        { wch: 15 }, // ID
        { wch: 20 }, // Departamento
        { wch: 25 }, // Cargo
        { wch: 12 }, // Solicitudes
        { wch: 12 }, // Total Días
        { wch: 12 }  // Total Horas
      ];
      detailSheet['!cols'] = colWidths;

      // Generar archivo
      const fileName = `Reporte_General_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      console.log(`✅ Reporte general generado: ${fileName}`);
      alert(`Reporte general generado exitosamente: ${fileName}`);

    } catch (error) {
      console.error('Error generando reporte general:', error);
      alert('Error generando reporte general');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando empleados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Generar Reportes</h1>
            <p className="text-gray-600">Exportar solicitudes de permisos por empleado en un rango de fechas específico</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Volver al Inicio</span>
          </button>
        </div>
      </div>

      {/* Selector de rango de fechas */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Rango de Fechas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Inicio
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Fin
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={generateGeneralReport}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generando...' : 'Generar Reporte General'}
          </button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar empleado por nombre, ID o departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Lista de empleados */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Empleados ({filteredEmployees.length})
          </h2>
        </div>

        {currentEmployees.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron empleados</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Departamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cargo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {employee.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.employeeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => generateEmployeeReport(employee)}
                          disabled={generatingReports.has(employee.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {generatingReports.has(employee.id) ? 'Generando...' : 'Generar Reporte'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                      <span className="font-medium">{Math.min(endIndex, filteredEmployees.length)}</span> de{' '}
                      <span className="font-medium">{filteredEmployees.length}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
