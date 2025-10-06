import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Users,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ImportEmployee {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  department: string;
  position: string;
  employeeType: 'operativo' | 'administrativo';
  hireDate: string;
}

interface ImportResult {
  success: ImportEmployee[];
  errors: Array<{
    row: number;
    employeeId: string;
    errors: string[];
  }>;
}

interface ImportEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (employees: ImportEmployee[]) => Promise<{ success: number; total: number; failed: number }>;
  existingEmployees: Array<{ employeeId: string; email: string }>;
}

export const ImportEmployeesModal: React.FC<ImportEmployeesModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingEmployees
}) => {
  const [file, setFile] = useState<File | null>(null);

  const [validationResults, setValidationResults] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Plantilla de ejemplo
  const templateData = [
    {
      employeeId: 'EMP001',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@empresa.com',
      gender: 'male',
      department: 'Tecnología',
      position: 'Desarrollador',
      employeeType: 'operativo',
      hireDate: '2024-01-15'
    },
    {
      employeeId: 'EMP002',
      firstName: 'María',
      lastName: 'González',
      email: 'maria.gonzalez@empresa.com',
      gender: 'female',
      department: 'Recursos Humanos',
      position: 'Analista',
      employeeType: 'administrativo',
      hireDate: '2024-02-01'
    }
  ];

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Empleados');
    XLSX.writeFile(wb, 'plantilla_empleados.xlsx');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = Array.from(event.dataTransfer.files);
    const file = files[0];
    
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'csv' || fileExtension === 'xlsx' || fileExtension === 'xls') {
        setFile(file);
        processFile(file);
      } else {
        alert('Por favor, selecciona un archivo Excel (.xlsx, .xls) o CSV (.csv)');
      }
    }
  };

  const processFile = async (selectedFile: File) => {
    setIsProcessing(true);
    try {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      let data: any[] = [];

      if (fileExtension === 'csv') {
        // Procesar CSV
        const text = await selectedFile.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        data = result.data as any[];
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Procesar Excel
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
      } else {
        throw new Error('Formato de archivo no soportado. Use CSV o Excel.');
      }

             // Mapear y validar datos
       const mappedData = data.map((row) => ({
         employeeId: String(row.employeeId || row['ID Empleado'] || row['Employee ID'] || '').trim(),
         firstName: String(row.firstName || row['Nombre'] || row['First Name'] || '').trim(),
         lastName: String(row.lastName || row['Apellido'] || row['Last Name'] || '').trim(),
         email: String(row.email || row['Email'] || row['Correo'] || '').trim(),
         gender: String(row.gender || row['Género'] || row['Gender'] || '').trim().toLowerCase() as 'male' | 'female' | 'other',
         department: String(row.department || row['Departamento'] || row['Department'] || '').trim(),
         position: String(row.position || row['Puesto'] || row['Position'] || '').trim(),
         employeeType: String(row.employeeType || row['Tipo Empleado'] || row['Employee Type'] || '').trim().toLowerCase() as 'operativo' | 'administrativo',
         hireDate: String(row.hireDate || row['Fecha Contratación'] || row['Hire Date'] || '').trim(),
         isProfessionalService: Boolean(row.isProfessionalService || row['Servicio Profesional'] || row['Professional Service'] || false)
       }));

       validateData(mappedData);
    } catch (error) {
      console.error('Error procesando archivo:', error);
      alert('Error procesando el archivo. Verifica que el formato sea correcto.');
    } finally {
      setIsProcessing(false);
    }
  };

  const validateData = (data: ImportEmployee[]) => {
    const errors: Array<{ row: number; employeeId: string; errors: string[] }> = [];
    const success: ImportEmployee[] = [];

    // Validar límite de 500 empleados
    if (data.length > 500) {
      errors.push({
        row: 0,
        employeeId: 'LÍMITE EXCEDIDO',
        errors: [`No se pueden importar más de 500 empleados a la vez. El archivo contiene ${data.length} empleados.`]
      });
      setValidationResults({ success: [], errors });
      return;
    }

    data.forEach((employee, index) => {
      const rowErrors: string[] = [];
      const rowNumber = index + 2; // +2 porque Excel/CSV empieza en 1 y tiene header

      // Validar campos obligatorios
      if (!employee.employeeId) {
        rowErrors.push('ID de empleado es requerido');
      } else if (employee.employeeId.length < 3) {
        rowErrors.push('ID de empleado debe tener al menos 3 caracteres');
      }

      if (!employee.firstName) {
        rowErrors.push('Nombre es requerido');
      } else if (employee.firstName.length < 2) {
        rowErrors.push('Nombre debe tener al menos 2 caracteres');
      }

      if (!employee.lastName) {
        rowErrors.push('Apellido es requerido');
      } else if (employee.lastName.length < 2) {
        rowErrors.push('Apellido debe tener al menos 2 caracteres');
      }

      if (!employee.email) {
        rowErrors.push('Email es requerido');
      } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(employee.email)) {
        rowErrors.push('Email inválido');
      }

      if (!employee.gender) {
        rowErrors.push('Género es requerido');
      } else if (!['male', 'female', 'other'].includes(employee.gender)) {
        rowErrors.push('Género debe ser: male, female, o other');
      }

      if (!employee.department) {
        rowErrors.push('Departamento es requerido');
      } else if (employee.department.length < 2) {
        rowErrors.push('Departamento debe tener al menos 2 caracteres');
      }

      if (!employee.position) {
        rowErrors.push('Puesto es requerido');
      } else if (employee.position.length < 2) {
        rowErrors.push('Puesto debe tener al menos 2 caracteres');
      }

      if (!employee.employeeType) {
        rowErrors.push('Tipo de empleado es requerido');
      } else if (!['operativo', 'administrativo'].includes(employee.employeeType)) {
        rowErrors.push('Tipo de empleado debe ser: operativo o administrativo');
      }

      if (!employee.hireDate) {
        rowErrors.push('Fecha de contratación es requerida');
      } else {
        const hireDate = new Date(employee.hireDate);
        if (isNaN(hireDate.getTime())) {
          rowErrors.push('Fecha de contratación inválida');
        }
      }

      // Validar duplicados con empleados existentes
      const existingEmployeeId = existingEmployees.find(emp => emp.employeeId === employee.employeeId);
      if (existingEmployeeId) {
        rowErrors.push('ID de empleado ya existe en el sistema');
      }

      const existingEmail = existingEmployees.find(emp => emp.email === employee.email);
      if (existingEmail) {
        rowErrors.push('Email ya existe en el sistema');
      }

      // Validar duplicados dentro del archivo
      const duplicateInFile = data.slice(0, index).find(emp => emp.employeeId === employee.employeeId);
      if (duplicateInFile) {
        rowErrors.push('ID de empleado duplicado en el archivo');
      }

      const duplicateEmailInFile = data.slice(0, index).find(emp => emp.email === employee.email);
      if (duplicateEmailInFile) {
        rowErrors.push('Email duplicado en el archivo');
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: rowNumber,
          employeeId: employee.employeeId || 'Sin ID',
          errors: rowErrors
        });
      } else {
        success.push(employee);
      }
    });

    setValidationResults({ success, errors });
  };

  const handleImport = async () => {
    if (!validationResults || validationResults.success.length === 0) {
      alert('No hay empleados válidos para importar.');
      return;
    }

    // Mostrar confirmación con detalles
    const confirmMessage = `¿Estás seguro de que quieres importar ${validationResults.success.length} empleados?\n\n` +
      `• Empleados válidos: ${validationResults.success.length}\n` +
      `• Errores encontrados: ${validationResults.errors.length}\n\n` +
      `Solo se importarán los empleados válidos.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsImporting(true);
    try {
      const result = await onImport(validationResults.success);
      
      // Mostrar resultado detallado
      const resultMessage = `✅ Importación completada exitosamente!\n\n` +
        `• Empleados importados: ${result.success}\n` +
        `• Empleados fallidos: ${result.failed}\n` +
        `• Total procesados: ${result.total}\n\n` +
        `${validationResults.errors.length > 0 ? 
          '⚠️ Algunos empleados no se importaron debido a errores. Revisa la lista de errores arriba.' : 
          '🎉 Todos los empleados se importaron correctamente.'}`;
      
      alert(resultMessage);
      handleClose();
    } catch (error) {
      console.error('Error importando empleados:', error);
      alert('❌ Error al importar empleados. Por favor, inténtalo de nuevo.\n\nDetalles: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setValidationResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Importar Empleados</span>
            </CardTitle>
            <Button variant="ghost" onClick={handleClose} className="p-2">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <CardDescription>
            Importa empleados desde un archivo Excel (.xlsx) o CSV (.csv)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instrucciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Campos Obligatorios:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
              <div>• ID de Empleado (mínimo 3 caracteres)</div>
              <div>• Nombre (mínimo 2 caracteres)</div>
              <div>• Apellido (mínimo 2 caracteres)</div>
              <div>• Email (formato válido)</div>
              <div>• Género (male/female/other)</div>
              <div>• Departamento (mínimo 2 caracteres)</div>
              <div>• Puesto (mínimo 2 caracteres)</div>
              <div>• Tipo de Empleado (operativo/administrativo)</div>
              <div>• Fecha de Contratación (YYYY-MM-DD)</div>
            </div>
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              ⚠️ <strong>Límite:</strong> Máximo 100 empleados por importación
            </div>
          </div>

          {/* Descargar plantilla */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-gray-900">¿No tienes una plantilla?</h3>
              <p className="text-sm text-gray-600">Descarga nuestra plantilla de ejemplo</p>
            </div>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla
            </Button>
          </div>

          {/* Subir archivo */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {file ? file.name : 'Selecciona un archivo'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Arrastra y suelta tu archivo aquí, o haz clic para seleccionar
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              variant="outline"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Seleccionar Archivo
                </>
              )}
            </Button>
          </div>

          {/* Resultados de validación */}
          {validationResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Resultados de Validación</h3>
                <div className="flex space-x-2">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {validationResults.success.length} Válidos
                  </Badge>
                  {validationResults.errors.length > 0 && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {validationResults.errors.length} Con Errores
                    </Badge>
                  )}
                </div>
              </div>

              {/* Empleados válidos */}
              {validationResults.success.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">
                    ✅ Empleados Válidos ({validationResults.success.length})
                  </h4>
                  <p className="text-sm text-green-700 mb-3">
                    Estos empleados están listos para ser importados.
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {validationResults.success.map((employee, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-white border border-green-200 rounded p-2">
                        <div className="flex-1">
                          <span className="font-medium text-green-800">
                            {employee.employeeId} - {employee.firstName} {employee.lastName}
                          </span>
                          <div className="text-xs text-green-600">
                            {employee.department} • {employee.position}
                          </div>
                        </div>
                        <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errores */}
              {validationResults.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">
                    ⚠️ Errores Encontrados ({validationResults.errors.length})
                  </h4>
                  <p className="text-sm text-red-700 mb-3">
                    Los siguientes empleados no se pueden importar. Corrige los errores y vuelve a intentar.
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-3">
                    {validationResults.errors.map((error, index) => (
                      <div key={index} className="bg-white border border-red-200 rounded p-3">
                        <div className="font-medium text-red-800 mb-1">
                          📄 Fila {error.row} - ID: {error.employeeId}
                        </div>
                        <ul className="list-disc list-inside text-red-700 ml-2 space-y-1">
                          {error.errors.map((err, errIndex) => (
                            <li key={errIndex} className="text-sm">• {err}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    💡 <strong>Sugerencia:</strong> Corrige los errores en tu archivo y vuelve a cargarlo, o continúa con la importación de solo los empleados válidos.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={!validationResults || validationResults.success.length === 0 || isImporting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Empleados
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
