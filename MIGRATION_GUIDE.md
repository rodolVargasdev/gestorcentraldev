# 🔄 GUÍA DE MIGRACIÓN FIREBASE

## 📋 **RESUMEN**

Esta guía te ayudará a migrar tu proyecto a un nuevo proyecto de Firebase usando variables de entorno. Todo está automatizado para facilitar el proceso.

## 🚀 **MIGRACIÓN RÁPIDA**

### **Opción 1: Migración Automática (Recomendada)**
```bash
# Ejecutar migración completa
npm run migrate-firebase

# Seguir las instrucciones en pantalla
# El script te guiará paso a paso
```

### **Opción 2: Configuración Manual**
```bash
# 1. Configurar variables de entorno
npm run setup-env

# 2. Verificar configuración
npm run verify-env

# 3. Construir proyecto
npm run build

# 4. Desplegar
npm run deploy-env
```

## 📝 **PASOS DETALLADOS**

### **1. PREPARACIÓN**

#### **A. Obtener Credenciales del Nuevo Proyecto:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **Configuración del proyecto** > **General**
4. En **Tus apps**, crea una nueva app web
5. Copia las credenciales que aparecen

#### **B. Configurar Servicios:**
- ✅ **Authentication**: Habilitar Email/Password
- ✅ **Firestore Database**: Crear base de datos
- ✅ **Hosting**: Configurar hosting

### **2. MIGRACIÓN AUTOMÁTICA**

```bash
# Ejecutar script de migración
npm run migrate-firebase
```

**El script hará:**
- ✅ Backup de configuración actual
- ✅ Crear archivo `.env.local` con nuevas credenciales
- ✅ Actualizar `.firebaserc`
- ✅ Verificar configuración
- ✅ Construir proyecto
- ✅ Mostrar próximos pasos

### **3. MIGRACIÓN MANUAL**

#### **A. Configurar Variables de Entorno:**
```bash
npm run setup-env
```

#### **B. Verificar Configuración:**
```bash
npm run verify-env
```

#### **C. Construir Proyecto:**
```bash
npm run build
```

#### **D. Desplegar:**
```bash
npm run deploy-env
```

## 🔧 **SCRIPTS DISPONIBLES**

| Script | Comando | Descripción |
|--------|---------|-------------|
| `setup-env` | `npm run setup-env` | Configurar variables de entorno |
| `verify-env` | `npm run verify-env` | Verificar configuración |
| `migrate-firebase` | `npm run migrate-firebase` | Migración completa |
| `deploy-env` | `npm run deploy-env` | Despliegue automatizado |
| `firebase-auth` | `npm run firebase-auth` | Configurar autenticación Firebase |
| `diagnose-firebase` | `npm run diagnose-firebase` | Diagnosticar problemas |

## 📁 **ARCHIVOS IMPORTANTES**

### **Archivos de Configuración:**
- `.env.local` - Variables de entorno (NO subir a Git)
- `.firebaserc` - Configuración de proyecto Firebase
- `firestore.rules` - Reglas de seguridad
- `firestore.indexes.json` - Índices de Firestore

### **Archivos de Backup:**
- `backup-YYYY-MM-DD/` - Backup automático creado durante migración

## 🛠️ **CONFIGURACIÓN MANUAL**

### **Archivo .env.local:**
```env
# Configuración del proyecto Firebase
VITE_FIREBASE_API_KEY=tu_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### **Archivo .firebaserc:**
```json
{
  "projects": {
    "default": "tu-proyecto-id"
  }
}
```

## 🚨 **SOLUCIÓN DE PROBLEMAS**

### **Error: "Archivo .env.local no encontrado"**
```bash
npm run setup-env
```

### **Error: "No autenticado en Firebase" o "403 Permission denied"**
```bash
# Opción 1: Configurar autenticación automáticamente
npm run firebase-auth

# Opción 2: Manual
firebase logout
firebase login
firebase use tu-proyecto-id
```

### **Error: "Proyecto no encontrado"**
```bash
# Verificar proyectos disponibles
firebase projects:list

# Seleccionar proyecto correcto
firebase use tu-proyecto-id

# O configurar autenticación completa
npm run firebase-auth
```

### **Error: "Servicios no habilitados"**
1. Ve a Firebase Console
2. Habilita Authentication, Firestore y Hosting
3. Vuelve a intentar el despliegue

### **Error: "The caller does not have permission"**
```bash
# Diagnosticar el problema
npm run diagnose-firebase

# Reconfigurar autenticación
npm run firebase-auth

# Verificar configuración
npm run verify-env
```

## 📋 **VERIFICACIÓN POST-MIGRACIÓN**

### **1. Verificar Aplicación:**
- ✅ La aplicación carga correctamente
- ✅ El login funciona
- ✅ Se pueden crear usuarios
- ✅ Los tipos de licencias se inicializan

### **2. Verificar Base de Datos:**
- ✅ Colección `users` se crea automáticamente
- ✅ Colección `licenseTypes` se inicializa
- ✅ Colección `employees` funciona correctamente

### **3. Verificar Funcionalidades:**
- ✅ Crear empleados
- ✅ Solicitar licencias
- ✅ Generar reportes
- ✅ Reset de disponibilidad

## 🔄 **REVERTIR MIGRACIÓN**

Si necesitas volver al proyecto anterior:

```bash
# Restaurar archivos del backup
cp backup-YYYY-MM-DD/.env.local .
cp backup-YYYY-MM-DD/.firebaserc .

# Verificar configuración
npm run verify-env

# Desplegar
npm run deploy-env
```

## 💡 **CONSEJOS**

1. **Siempre haz backup** antes de migrar
2. **Verifica la configuración** antes de desplegar
3. **Prueba todas las funcionalidades** después de la migración
4. **Mantén las credenciales seguras** (no subas .env.local a Git)

## 🆘 **SOPORTE**

Si tienes problemas con la migración:

1. Verifica que todos los servicios estén habilitados en Firebase
2. Confirma que las credenciales sean correctas
3. Revisa los logs de error en la consola
4. Usa `npm run verify-env` para diagnosticar problemas

---

**¡La migración está diseñada para ser simple y automatizada! Sigue los pasos y tendrás tu nuevo proyecto funcionando en minutos.** 🚀
