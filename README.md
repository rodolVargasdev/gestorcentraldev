# 🏢 Sistema de Gestión de Licencias y Permisos

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> Sistema completo de gestión de licencias, permisos y empleados para empresas, construido con tecnologías modernas y desplegado en Firebase.

## 📋 Descripción del Proyecto

Este sistema permite gestionar de manera eficiente todos los aspectos relacionados con licencias y permisos de empleados en una empresa. Incluye gestión completa de empleados, tipos de licencias configurables, control de disponibilidad, historial de solicitudes y reportes avanzados.

### 🎯 Características Principales

#### 👥 Gestión de Empleados
- ✅ **CRUD completo** de empleados con validaciones
- ✅ **Importación masiva** desde CSV/XLSX
- ✅ **Exportación masiva** con filtros personalizables
- ✅ **Búsqueda y filtros** avanzados
- ✅ **Gestión por departamentos**
- ✅ **Servicio profesional** (restricciones de permisos)

#### 📄 Gestión de Licencias
- ✅ **16 tipos de licencias** completamente configurados
- ✅ **Cálculos automáticos** de fechas y períodos
- ✅ **Validaciones por género** (maternidad, paternidad)
- ✅ **Control de disponibilidad** anual/mensual
- ✅ **Permisos retroactivos** sin afectar disponibilidad actual
- ✅ **Historial completo** de todas las solicitudes

#### 🔐 Sistema de Autenticación
- ✅ **Firebase Authentication** integrado
- ✅ **Control de acceso** por roles (Admin, Manager, Employee)
- ✅ **Sesiones seguras** con persistencia

#### 📊 Reportes y Analytics
- ✅ **Dashboard administrativo** con métricas
- ✅ **Reportes de disponibilidad** en tiempo real
- ✅ **Historial de auditoría** completo
- ✅ **Exportación de datos** en múltiples formatos

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** - Framework principal
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de estilos
- **Zustand** - State management
- **React Hook Form** - Gestión de formularios
- **Lucide React** - Iconos
- **Date-fns** - Utilidades de fechas

### Backend & Base de Datos
- **Firebase Firestore** - Base de datos NoSQL
- **Firebase Authentication** - Autenticación
- **Firebase Hosting** - Hosting estático
- **Firebase Security Rules** - Control de acceso

### Desarrollo
- **ESLint** - Linting y calidad de código
- **PostCSS** - Procesamiento de CSS
- **Autoprefixer** - Prefijos CSS automáticos

## 📋 Tipos de Licencias Implementados

| Código | Nombre | Categoría | Período | Cantidad | Descripción |
|--------|--------|-----------|---------|----------|-------------|
| **PG01** | Permiso Personal con Goce | HORAS | Anual | 40h | Permisos personales remunerados |
| **PS02** | Permiso Personal sin Goce | HORAS | Anual | 480h | Permisos personales no remunerados |
| **GG05** | Enfermedad Gravísima | DIAS | Anual | 17d | Por enfermedad grave de familiar |
| **VG11** | Vacaciones Anuales | DIAS | Anual | 15d | Vacaciones ordinarias |
| **VGA12** | Vacaciones Acumulativas | DIAS | Anual | 15d | Vacaciones con acumulación (máx. 90d) |
| **LG08** | Lactancia Materna | OCASION | Ninguno | 6m | Licencia por lactancia |
| **MG07** | Maternidad | OCASION | Ninguno | 112d | Licencia por embarazo |
| **OM14** | Olvido de Marcación | OCASION | Mensual | 2/mes | Permiso por olvido de marcación |
| **CT15** | Cambio de Turno | OCASION | Mensual | 3/mes | Permiso por cambio de turno |
| **EG03** | Enfermedad con Goce | DIAS | Anual | 12d | Enfermedad con remuneración |
| **ES04** | Enfermedad sin Goce | DIAS | Anual | 30d | Enfermedad sin remuneración |
| **DG06** | Duelo | DIAS | Anual | 3d | Por fallecimiento de familiar |
| **AG09** | Paternidad/Adopción | DIAS | Anual | 3d | Licencia por paternidad |
| **JRV12** | Juntas Receptoras | OCASION | Ninguno | N/A | Participación en juntas |
| **JU13** | Conformar Jurado | OCASION | Ninguno | N/A | Servicio de jurado |
| **RH16** | Movimiento RH | OCASION | Ninguno | N/A | Reubicación de personal |

## 🚀 Guía de Instalación y Configuración

### 📋 Requerimientos Previos

#### Sistema Operativo
- ✅ **Windows 10/11** (recomendado)
- ✅ **macOS 10.15+**
- ✅ **Linux Ubuntu 18.04+**

#### Software Requerido
- ✅ **Node.js 18.x** o superior ([Descargar](https://nodejs.org/))
- ✅ **npm 8.x** o superior (incluido con Node.js)
- ✅ **Git** ([Descargar](https://git-scm.com/))
- ✅ **Cuenta de Google** (para Firebase)

#### Verificar Instalación
```bash
# Verificar Node.js y npm
node --version
npm --version

# Verificar Git
git --version
```

### 📥 Clonación del Repositorio

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/gestor-licencias-firebase.git

# Entrar al directorio del proyecto
cd gestor-licencias-firebase

# Instalar dependencias
npm install
```

### 🔥 Configuración de Firebase

#### Opción 1: Configuración desde Cero

1. **Crear Proyecto en Firebase**
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Haz clic en "Crear un proyecto"
   - Ingresa el nombre: `gestor-licencias`
   - Habilita Google Analytics (opcional)

2. **Habilitar Servicios**
   - **Authentication**: Ve a Authentication > Comenzar
     - Habilita "Correo electrónico/contraseña"
     - (Opcional) Configura proveedores adicionales
   - **Firestore**: Ve a Firestore Database > Crear base de datos
     - Modo de producción
     - Ubicación: `us-central1` (recomendado)
   - **Hosting**: Ve a Hosting > Comenzar
     - Dominio personalizado (opcional)

3. **Obtener Credenciales**
   - Ve a Configuración del proyecto > General
   - En "Tus apps", crea una app web
   - Copia la configuración (apiKey, authDomain, etc.)

4. **Configurar Variables de Entorno**
   ```bash
   # Copiar archivo de ejemplo
   cp env.example .env.local

   # Editar .env.local con tus credenciales
   ```

   **Contenido de `.env.local`:**
   ```env
   VITE_FIREBASE_API_KEY=tu_api_key_aqui
   VITE_FIREBASE_AUTH_DOMAIN=gestor-licencias.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=gestor-licencias
   VITE_FIREBASE_STORAGE_BUCKET=gestor-licencias.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   ```

#### Opción 2: Usar Configuración Existente

Si ya tienes un proyecto Firebase configurado, simplemente actualiza las credenciales en `src/lib/firebase.config.ts`:

```typescript
export const firebaseConfig = {
  apiKey: "tu_api_key",
  authDomain: "tu_proyecto.firebaseapp.com",
  projectId: "tu_proyecto",
  storageBucket: "tu_proyecto.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 🏃‍♂️ Ejecución Local

```bash
# Iniciar servidor de desarrollo
npm run dev

# O usando el script personalizado para Windows
npm run start:dev
```

El proyecto estará disponible en:
- **Local**: `http://localhost:5173`
- **Red local**: `http://192.168.x.x:5173` (para testing móvil)

### 🔧 Scripts de Configuración

#### Inicializar Base de Datos
```bash
# Ejecutar desde el directorio scripts/
node scripts/initialize-license-types.mjs
node scripts/create-admin-user.mjs
```

#### Verificar Configuración
```bash
# Verificar Firebase
node scripts/check-firebase.cjs

# Verificar tipos de licencias
node scripts/check-license-types.cjs
```

## 🚀 Despliegue (Deploy)

### Opción 1: Deploy Automático con GitHub Actions

1. **Configurar Secrets en GitHub**
   - Ve a tu repositorio > Settings > Secrets and variables > Actions
   - Agrega estos secrets:
     ```
     FIREBASE_SERVICE_ACCOUNT: contenido del service account JSON
     FIREBASE_PROJECT_ID: tu_project_id
     ```

2. **Push a rama main**
   ```bash
   git add .
   git commit -m "Deploy a producción"
   git push origin main
   ```

3. **GitHub Actions** automáticamente:
   - Instala dependencias
   - Ejecuta tests (si existen)
   - Construye la aplicación
   - Despliega a Firebase Hosting

### Opción 2: Deploy Manual

#### Preparar Build
```bash
# Crear build de producción
npm run build

# Preview del build (opcional)
npm run preview
```

#### Deploy con Firebase CLI
```bash
# Instalar Firebase CLI (global)
npm install -g firebase-tools

# Login en Firebase
firebase login

# Inicializar proyecto (primera vez)
firebase init hosting

# Deploy
firebase deploy --only hosting
```

### Opción 3: Onboarding Súper Amigable (Reglas, Índices y Setup)

1) Seleccionar proyecto Firebase
```bash
firebase login
firebase use <tu_project_id>
```

2) Desplegar reglas e índices en 1 comando
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

3) Inicialización guiada (opcional)
```bash
# Corrige .firebaserc → usa tu proyecto, verifica acceso y despliega índices
node scripts/fix-firebase-project.cjs

# O solo índices con validaciones
node scripts/deploy-indexes.cjs
```

4) Inicialización automática (ya incluida)
```bash
# ✅ AUTOMÁTICO: Los tipos de licencias se inicializan automáticamente al abrir la app
# Los scripts manuales son opcionales para casos especiales:
node scripts/initialize-license-types.mjs  # Solo si quieres forzar actualización
```

5) Probar conexión y permisos sin levantar el dev server
```bash
start test-firebase.html
# Usa los botones: Login → Verificar Tipos → Verificar/Agregar VGA12 → Probar Consulta Licencias
```

#### Deploy con Scripts Personalizados
```bash
# Usar script de deploy personalizado
node scripts/deploy-production.mjs
```

## 🔧 Configuración Avanzada

### Reglas de Seguridad de Firestore

El proyecto incluye reglas de seguridad configuradas en `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas de autenticación y autorización
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Colecciones protegidas
    match /employees/{employeeId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin() || (isAuthenticated() && request.auth.uid == resource.data.userId);
    }
  }
}
```

### Índices de Firestore

Los índices necesarios están configurados en `firestore.indexes.json`. Si necesitas agregar índices personalizados:

```json
{
  "indexes": [
    {
      "collectionGroup": "licenseRequests",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "employeeId", "order": "ASCENDING"},
        {"fieldPath": "startDate", "order": "DESCENDING"}
      ]
    }
  ]
}
```

## 🐛 Solución de Problemas

### Problemas Comunes

#### 1. Error de Conexión a Firebase
```
❌ Missing or insufficient permissions
```
**Solución:**
- Verifica que las credenciales en `firebase.config.ts` sean correctas
- Asegúrate de que Firestore esté habilitado en Firebase Console
- Revisa las reglas de seguridad en `firestore.rules`

#### 2. Error de Build
```
❌ Module not found: Can't resolve 'firebase/app'
```
**Solución:**
```bash
# Limpiar node_modules y reinstallar
rm -rf node_modules package-lock.json
npm install
```

#### 3. Error de Tipos TypeScript
```
❌ Cannot find module './firebase.config'
```
**Solución:**
- Verifica que el archivo `firebase.config.ts` exista
- Reinicia el servidor de desarrollo

#### 4. Problemas con Fechas
```
❌ Invalid time value
```
**Solución:**
- Verifica que las fechas estén en formato correcto
- Usa las utilidades de `dateUtils.ts` para manejo de zonas horarias

### Debug y Testing

#### Archivo de Testing HTML
Para testing rápido sin servidor:
```bash
# Abrir en navegador
start test-firebase.html
```

#### Scripts de Debug
```bash
# Debug de aplicación
node scripts/debug-app.cjs

# Verificar tipos de licencias
node scripts/check-license-types.cjs

# Debug de historial de licencias
node scripts/debug-license-history.cjs
```

## 📁 Estructura del Proyecto

```
gestor-licencias-frontend/
├── 📁 dataconnect/              # Firebase Data Connect (opcional)
├── 📁 node_modules/             # Dependencias
├── 📁 public/                   # Archivos estáticos
├── 📁 scripts/                  # Scripts de configuración y utilities
│   ├── create-admin-user.mjs    # Crear usuario administrador
│   ├── initialize-license-types.mjs  # Inicializar tipos de licencias
│   └── check-firebase.cjs       # Verificar configuración Firebase
├── 📁 src/
│   ├── 📁 components/           # Componentes React reutilizables
│   │   ├── 📁 auth/            # Componentes de autenticación
│   │   ├── 📁 employees/       # Componentes de empleados
│   │   ├── 📁 layout/          # Layout y navegación
│   │   └── 📁 ui/              # Componentes base de UI
│   ├── 📁 lib/                 # Configuración de librerías
│   │   ├── firebase.config.ts  # Config Firebase
│   │   ├── firebase.ts         # Inicialización Firebase
│   │   └── utils.ts            # Utilidades generales
│   ├── 📁 pages/               # Páginas principales (rutas)
│   │   ├── DashboardPage.tsx   # Dashboard principal
│   │   ├── EmployeesPage.tsx   # Gestión de empleados
│   │   ├── LoginPage.tsx       # Página de login
│   │   └── ...                 # Otras páginas
│   ├── 📁 services/            # Servicios de negocio
│   │   ├── authService.ts      # Servicio de autenticación
│   │   ├── employeeService.ts  # Servicio de empleados
│   │   └── licenseService.ts   # Servicio de licencias
│   ├── 📁 stores/              # Estado global (Zustand)
│   │   ├── authStore.ts        # Store de autenticación
│   │   ├── employeeStore.ts    # Store de empleados
│   │   └── licenseStore.ts     # Store de licencias
│   ├── 📁 types/               # Definiciones TypeScript
│   │   ├── index.ts            # Tipos principales
│   │   └── licenseTypes.ts     # Tipos de licencias
│   ├── 📁 utils/               # Utilidades
│   │   ├── dateUtils.ts        # Utilidades de fechas
│   │   └── formatUtils.ts      # Utilidades de formato
│   ├── App.tsx                 # Componente principal
│   ├── index.css               # Estilos globales
│   └── main.tsx               # Punto de entrada
├── 📁 test-files/              # Archivos de prueba para importación
├── 📄 .env.example             # Ejemplo de variables de entorno
├── 📄 firebase.json            # Configuración Firebase
├── 📄 firestore.rules          # Reglas de seguridad Firestore
├── 📄 firestore.indexes.json   # Índices Firestore
├── 📄 package.json             # Dependencias y scripts
├── 📄 tailwind.config.js       # Configuración Tailwind
├── 📄 tsconfig.json            # Configuración TypeScript
└── 📄 README.md                # Esta documentación
```

## 🎯 Funcionalidades Avanzadas

### Sistema de Servicio Profesional
Los empleados marcados como "servicio profesional" solo pueden acceder a:
- **OM14**: Olvido de marcación (máx. 2/mes)
- **CT15**: Cambio de turno (máx. 3/mes)

### Permisos Retroactivos
- ✅ **Permisos anuales retroactivos** no afectan disponibilidad actual
- ✅ **Permisos mensuales retroactivos** no afectan mes actual
- ✅ **Historial completo** por períodos

### Reset de Disponibilidad
- 🔄 **Reset mensual** al inicio de cada mes
- 🔄 **Reset anual** al inicio de cada año
- 🎯 **Acumulación automática** para vacaciones (VGA12)

## 📊 Monitoreo y Analytics

### Métricas Incluidas
- 📈 **Uso por tipo de licencia**
- 👥 **Empleados activos**
- 📅 **Solicitudes por período**
- 🔍 **Disponibilidad en tiempo real**

### Logs de Auditoría
- ✅ **Todas las operaciones** registradas
- ✅ **Cambios de disponibilidad** auditados
- ✅ **Accesos de usuarios** monitoreados

## 🤝 Contribución

1. **Fork** el proyecto
2. **Crea** una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abre** un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
