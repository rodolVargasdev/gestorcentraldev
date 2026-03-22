# 🚀 Guía de Configuración - Gestor de Licencias Firebase

Esta guía te ayudará a configurar el proyecto desde cero para tu propio proyecto de Firebase.

## 📋 Prerrequisitos

- ✅ **Node.js** (versión 18 o superior)
- ✅ **npm** o **yarn**
- ✅ **Cuenta de Google** para Firebase
- ✅ **Git** instalado

## 🔧 Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/gestor-licencias-firebase.git
cd gestor-licencias-firebase
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Crear Proyecto en Firebase

1. **Ve a [Firebase Console](https://console.firebase.google.com/)**
2. **Haz clic en "Agregar proyecto"**
3. **Asigna un nombre único** (ej: `mi-gestor-licencias`)
4. **Desactiva Google Analytics** (opcional)
5. **Finaliza la creación**

### 4. Configurar Servicios de Firebase

#### 🔐 Authentication
1. Ve a **Authentication** > **Método de acceso**
2. Habilita **Email/Password**
3. Habilita **Google** (opcional)
4. En **Dominios autorizados**, agrega:
   - `localhost`
   - Tu dominio de producción (ej: `mi-app.web.app`)

#### 🗄️ Firestore Database
1. Ve a **Firestore Database**
2. Haz clic en **"Crear base de datos"**
3. Selecciona **"Modo de prueba"** para desarrollo
4. Elige la ubicación recomendada (`us-central1`)

#### 🌐 Hosting
1. Ve a **Hosting**
2. Haz clic en **"Comenzar"**
3. Instala Firebase CLI si no lo tienes:
   ```bash
   npm install -g firebase-tools
   ```

### 5. Obtener Credenciales de Firebase

1. Ve a **Configuración del proyecto** > **General**
2. En **"Tus apps"**, haz clic en **"Agregar app"** > **Web**
3. Asigna un nombre (ej: `gestor-licencias-web`)
4. **Copia las credenciales** que aparecen

### 6. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp env.example .env.local

# Editar .env.local con tus credenciales
```

**Ejemplo de `.env.local`:**
```env
VITE_FIREBASE_API_KEY=<pega_aqui_la_api_key_de_firebase_console>
VITE_FIREBASE_AUTH_DOMAIN=mi-gestor-licencias.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mi-gestor-licencias
VITE_FIREBASE_STORAGE_BUCKET=mi-gestor-licencias.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 7. Configurar Reglas de Firestore

Ve a **Firestore Database** > **Rules** y usa estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura a usuarios autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Reglas específicas para empleados
    match /employees/{employeeId} {
      allow read, write: if request.auth != null;
    }
    
    // Reglas específicas para licencias
    match /licenses/{licenseId} {
      allow read, write: if request.auth != null;
    }
    
    // Reglas específicas para tipos de licencias
    match /licenseTypes/{typeId} {
      allow read, write: if request.auth != null;
    }
    
    // Reglas específicas para disponibilidad
    match /employeeAvailability/{employeeId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 8. Inicializar Firebase CLI

```bash
# Iniciar sesión en Firebase
firebase login

# Inicializar Firebase en el proyecto
firebase init
```

**Durante la inicialización:**
- ✅ Selecciona **Hosting** y **Firestore**
- ✅ Directorio público: `dist`
- ✅ Configurar como SPA: **Sí**
- ✅ Selecciona tu proyecto de Firebase
- ✅ No sobrescribir archivos existentes

### 9. Ejecutar el Proyecto

```bash
npm run dev
```

El proyecto estará disponible en `http://localhost:5173`

### 10. Crear Usuario Administrador

1. Ve a **Authentication** > **Usuarios**
2. Haz clic en **"Agregar usuario"**
3. Crea un usuario admin:
   - Email: `admin@empresa.com`
   - Contraseña: `admin123456`

### 11. Probar la Aplicación

1. **Accede a** `http://localhost:5173`
2. **Inicia sesión** con el usuario admin
3. **Verifica que todo funcione:**
   - ✅ Crear empleados
   - ✅ Importar empleados
   - ✅ Crear licencias
   - ✅ Ver disponibilidad

## 🚀 Deploy a Producción

### Opción 1: Deploy Manual

```bash
# Construir el proyecto
npm run build

# Deploy a Firebase
firebase deploy
```

### Opción 2: Deploy Automático (GitHub Actions)

1. **Sube el código a GitHub**
2. **Configura los secrets en GitHub:**
   - `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON de la cuenta de servicio)
3. **Haz push a main** - se desplegará automáticamente

## 🔍 Verificación Post-Configuración

### ✅ Checklist de Verificación

- [ ] **Firebase configurado** con todos los servicios
- [ ] **Variables de entorno** configuradas correctamente
- [ ] **Reglas de Firestore** aplicadas
- [ ] **Usuario admin** creado
- [ ] **Aplicación funcionando** en localhost
- [ ] **Tipos de licencias** inicializados automáticamente
- [ ] **Deploy exitoso** a Firebase Hosting

### 🧪 Pruebas Recomendadas

1. **Crear un empleado** y verificar disponibilidad
2. **Importar empleados** desde CSV/XLSX
3. **Crear diferentes tipos de licencias**
4. **Verificar cálculos automáticos** (maternidad, lactancia)
5. **Probar filtros y búsquedas**
6. **Exportar datos** en diferentes formatos

## 🆘 Solución de Problemas

### Error: "Firebase not initialized"
- Verifica que las variables de entorno estén correctas
- Asegúrate de que el archivo `.env.local` existe

### Error: "Permission denied"
- Verifica las reglas de Firestore
- Asegúrate de estar autenticado

### Error: "Project not found"
- Verifica el `VITE_FIREBASE_PROJECT_ID`
- Asegúrate de que el proyecto existe en Firebase Console

### Error: "Authentication failed"
- Verifica que el usuario admin esté creado
- Revisa los dominios autorizados en Authentication

## 📞 Soporte

Si tienes problemas:
1. **Revisa los logs** en la consola del navegador
2. **Verifica la configuración** de Firebase
3. **Consulta la documentación** de Firebase
4. **Abre un issue** en GitHub

---

**¡Listo! Tu Gestor de Licencias está configurado y funcionando.** 🎉
