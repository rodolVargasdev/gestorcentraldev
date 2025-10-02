import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { 
  X, 
  Download, 
  FileText, 
  FileSpreadsheet,
  Filter,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportOptions {
  format: 'xlsx' | 'csv';
  includeAllFields: boolean;
  selectedFields: string[];
  filters: {
    department: string;
    status: string;
    employeeType: string;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

interface ExportEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: any[];
  departments: string[];
}

const AVAILABLE_FIELDS = [
  { key: 'employeeId', label: 'ID de Empleado', required: true },
  { key: 'firstName', label: 'Nombre', required: true },
  { key: 'lastName', label: 'Apellido', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'phone', label: 'Teléfono', required: false },
  { key: 'department', label: 'Departamento', required: true },
  { key: 'position', label: 'Puesto', required: true },
  { key: 'employeeType', label: 'Tipo de Empleado', required: true },
  { key: 'isProfessionalService', label: 'Servicio Profesional', required: false },
  { key: 'gender', label: 'Género', required: false },
  { key: 'hireDate', label: 'Fecha de Contratación', required: true },
  { key: 'birthDate', label: 'Fecha de Nacimiento', required: false },
  { key: 'salary', label: 'Salario', required: false },
  { key: 'address', label: 'Dirección', required: false },
  { key: 'isActive', label: 'Estado', required: true },
  { key: 'createdAt', label: 'Fecha de Creación', required: false },
  { key: 'updatedAt', label: 'Última Actualización', required: false }
];

export const ExportEmployeesModal: React.FC<ExportEmployeesModalProps> = ({
  isOpen,
  onClose,
  employees,
  departments
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'xlsx',
    includeAllFields: true,
    selectedFields: AVAILABLE_FIELDS.map(field => field.key),
    filters: {
      department: 'all',
      status: 'all',
      employeeType: 'all'
    },
    dateRange: {
      startDate: '',
      endDate: ''
    }
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleFieldToggle = (fieldKey: string) => {
    if (exportOptions.includeAllFields) {
      // Si está en "todos", cambiar a selección manual
      setExportOptions(prev => ({
        ...prev,
        includeAllFields: false,
        selectedFields: [fieldKey]
      }));
    } else {
      // Toggle individual field
      setExportOptions(prev => ({
        ...prev,
        selectedFields: prev.selectedFields.includes(fieldKey)
          ? prev.selectedFields.filter(f => f !== fieldKey)
          : [...prev.selectedFields, fieldKey]
      }));
    }
  };

  const handleSelectAllFields = () => {
    setExportOptions(prev => ({
      ...prev,
      includeAllFields: true,
      selectedFields: AVAILABLE_FIELDS.map(field => field.key)
    }));
  };

  const handleSelectRequiredFields = () => {
    setExportOptions(prev => ({
      ...prev,
      includeAllFields: false,
      selectedFields: AVAILABLE_FIELDS.filter(field => field.required).map(field => field.key)
    }));
  };

  const filterEmployees = () => {
    let filtered = [...employees];

    // Filtrar por departamento
    if (exportOptions.filters.department !== 'all') {
      filtered = filtered.filter(emp => emp.department === exportOptions.filters.department);
    }

    // Filtrar por estado
    if (exportOptions.filters.status !== 'all') {
      filtered = filtered.filter(emp => {
        if (exportOptions.filters.status === 'active') return emp.isActive;
        if (exportOptions.filters.status === 'inactive') return !emp.isActive;
        return true;
      });
    }

    // Filtrar por tipo de empleado
    if (exportOptions.filters.employeeType !== 'all') {
      filtered = filtered.filter(emp => emp.employeeType === exportOptions.filters.employeeType);
    }

    // Filtrar por rango de fechas (fecha de contratación)
    if (exportOptions.dateRange.startDate) {
      filtered = filtered.filter(emp => {
        const hireDate = new Date(emp.hireDate);
        const startDate = new Date(exportOptions.dateRange.startDate);
        return hireDate >= startDate;
      });
    }

    if (exportOptions.dateRange.endDate) {
      filtered = filtered.filter(emp => {
        const hireDate = new Date(emp.hireDate);
        const endDate = new Date(exportOptions.dateRange.endDate);
        return hireDate <= endDate;
      });
    }

    return filtered;
  };

  const formatEmployeeData = (employee: any) => {
    const data: any = {};
    
    const fieldsToExport = exportOptions.includeAllFields 
      ? AVAILABLE_FIELDS.map(field => field.key)
      : exportOptions.selectedFields;

    fieldsToExport.forEach(fieldKey => {
      const field = AVAILABLE_FIELDS.find(f => f.key === fieldKey);
      if (field) {
        let value = employee[fieldKey];
        
        // Formatear fechas
        if (fieldKey.includes('Date') && value) {
          value = new Date(value).toLocaleDateString('es-GT');
        }
        
        // Formatear estado
        if (fieldKey === 'isActive') {
          value = value ? 'Activo' : 'Inactivo';
        }
        
        // Formatear género
        if (fieldKey === 'gender') {
          value = value === 'male' ? 'Masculino' : value === 'female' ? 'Femenino' : 'Otro';
        }
        
        // Formatear tipo de empleado
        if (fieldKey === 'employeeType') {
          value = value === 'operativo' ? 'Operativo' : 'Administrativo';
        }

        // Formatear servicio profesional
        if (fieldKey === 'isProfessionalService') {
          value = value ? 'Sí' : 'No';
        }

        // Formatear salario
        if (fieldKey === 'salary' && value) {
          value = new Intl.NumberFormat('es-SV', {
            style: 'currency',
            currency: 'USD'
          }).format(value);
        }
        
        data[field.label] = value || '';
      }
    });
    
    return data;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const filteredEmployees = filterEmployees();
      
      if (filteredEmployees.length === 0) {
        alert('No hay empleados que coincidan con los filtros seleccionados.');
        return;
      }

      const exportData = filteredEmployees.map(formatEmployeeData);
      
      if (exportOptions.format === 'xlsx') {
        // Exportar como Excel
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Empleados');
        
        // Generar nombre de archivo con fecha
        const date = new Date().toISOString().split('T')[0];
        const fileName = `empleados_export_${date}.xlsx`;
        
        XLSX.writeFile(wb, fileName);
      } else {
        // Exportar como CSV
        const headers = Object.keys(exportData[0]);
        const csvContent = [
          headers.join(','),
          ...exportData.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        const date = new Date().toISOString().split('T')[0];
        const fileName = `empleados_export_${date}.csv`;
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      alert(`✅ Exportación completada exitosamente!\n\n• Empleados exportados: ${filteredEmployees.length}\n• Formato: ${exportOptions.format.toUpperCase()}\n• Campos incluidos: ${exportOptions.includeAllFields ? 'Todos' : exportOptions.selectedFields.length}`);
      
    } catch (error) {
      console.error('Error en la exportación:', error);
      alert('❌ Error al exportar empleados. Por favor, inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredEmployees = filterEmployees();
  const selectedFieldsCount = exportOptions.includeAllFields 
    ? AVAILABLE_FIELDS.length 
    : exportOptions.selectedFields.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Exportar Empleados</span>
            </CardTitle>
            <Button variant="ghost" onClick={onClose} className="p-2">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <CardDescription>
            Exporta empleados en formato Excel o CSV con opciones de filtrado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formato de exportación */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Formato de Exportación</h3>
            <div className="flex space-x-4">
              <Button
                variant={exportOptions.format === 'xlsx' ? 'default' : 'outline'}
                onClick={() => setExportOptions(prev => ({ ...prev, format: 'xlsx' }))}
                className="flex items-center space-x-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Excel (.xlsx)</span>
              </Button>
              <Button
                variant={exportOptions.format === 'csv' ? 'default' : 'outline'}
                onClick={() => setExportOptions(prev => ({ ...prev, format: 'csv' }))}
                className="flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>CSV (.csv)</span>
              </Button>
            </div>
          </div>

          {/* Campos a exportar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Campos a Exportar</h3>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllFields}
                >
                  Seleccionar Todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectRequiredFields}
                >
                  Solo Obligatorios
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABLE_FIELDS.map(field => (
                <label key={field.key} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeAllFields || exportOptions.selectedFields.includes(field.key)}
                    onChange={() => handleFieldToggle(field.key)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                </label>
              ))}
            </div>
            
            <div className="text-sm text-gray-600">
              Campos seleccionados: {selectedFieldsCount} de {AVAILABLE_FIELDS.length}
            </div>
          </div>

          {/* Filtros */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departamento
                </label>
                <select
                  value={exportOptions.filters.department}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    filters: { ...prev.filters, department: e.target.value }
                  }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">Todos los departamentos</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={exportOptions.filters.status}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    filters: { ...prev.filters, status: e.target.value }
                  }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Solo activos</option>
                  <option value="inactive">Solo inactivos</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Empleado
                </label>
                <select
                  value={exportOptions.filters.employeeType}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    filters: { ...prev.filters, employeeType: e.target.value }
                  }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="operativo">Solo operativos</option>
                  <option value="administrativo">Solo administrativos</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Contratación
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={exportOptions.dateRange.startDate}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, startDate: e.target.value }
                    }))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Desde"
                  />
                  <input
                    type="date"
                    value={exportOptions.dateRange.endDate}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, endDate: e.target.value }
                    }))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Hasta"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Resumen de Exportación</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-800">
              <div>
                <strong>Total empleados:</strong> {employees.length}
              </div>
              <div>
                <strong>Empleados filtrados:</strong> {filteredEmployees.length}
              </div>
              <div>
                <strong>Formato:</strong> {exportOptions.format.toUpperCase()}
              </div>
              <div>
                <strong>Campos:</strong> {selectedFieldsCount}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || filteredEmployees.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Empleados
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
