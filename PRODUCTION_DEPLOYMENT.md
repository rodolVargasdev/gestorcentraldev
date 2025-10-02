# 🚀 Guía de Despliegue a Producción

## 📋 Checklist Pre-Despliegue

### ✅ Requisitos Cumplidos

- [x] **Reglas de Firestore configuradas** - Autenticación requerida, control de roles
- [x] **Tipos de licencias inicializados** - 15 tipos listos
- [x] **Sistema de autenticación implementado** - Firebase Auth + roles
- [x] **Servicios de usuario creados** - UserService para gestión de roles
- [x] **Campos de seguridad agregados** - userId en empleados

## 🔥 Despliegue de Reglas de Seguridad

### Opción 1: Script Automático (Recomendado)

```bash
# Para Windows
setup-production.bat

# Para Linux/Mac
node scripts/create-admin-user.mjs admin@tudominio.com password123 super-admin
node deploy-rules.js
```

### Opción 2: Manual

1. **Desplegar reglas de Firestore:**
   ```bash
   firebase login
   firebase use licencias-gestor
   firebase deploy --only firestore:rules
   ```

2. **Crear usuario administrador:**
   ```bash
   node scripts/create-admin-user.mjs admin@tudominio.com password123 super-admin
   ```

## 🔐 Sistema de Roles

### Roles Disponibles

| Rol | Permisos |
|-----|----------|
| **super-admin** | Control total, crear admins, configuración sistema |
| **admin** | Gestionar empleados, solicitudes, tipos de licencia |
| **manager** | Ver todos empleados/solicitudes, crear empleados |
| **viewer** | Solo lectura de información básica |

### Usuario Administrador Inicial

- **Email:** El que configures durante el despliegue
- **Password:** El que configures durante el despliegue
- **Rol:** super-admin
- **Nota:** Este usuario puede crear otros administradores

## 📊 Reglas de Seguridad Detalladas

### Colección `users`
- ✅ Solo lectura de propio perfil
- ✅ Solo admins pueden crear/editar usuarios
- ❌ No se puede leer otros perfiles

### Colección `licenseTypes`
- ✅ Lectura pública para usuarios autenticados
- ✅ Solo admins pueden crear/editar/eliminar
- 📋 Contiene 15 tipos de licencias predefinidos

### Colección `employees`
- ✅ Managers+ pueden leer todos los empleados
- ✅ Empleados pueden leer/editar su propio perfil básico
- ✅ Managers+ pueden crear empleados
- ✅ Solo admins pueden eliminar empleados

### Colección `licenseRequests`
- ✅ Empleados pueden leer/crear sus propias solicitudes
- ✅ Managers+ pueden gestionar todas las solicitudes
- ✅ Empleados pueden editar campos limitados de sus solicitudes

## 🚀 Pasos Post-Despliegue

### 1. Verificar Instalación
```bash
# Verificar que la aplicación funciona
npm run dev
```

### 2. Primer Login
1. Abre `http://localhost:5173`
2. Inicia sesión con credenciales de admin
3. Verifica que puedes acceder al dashboard

### 3. Configuración Inicial
1. **Crear empleados** desde la sección de empleados
2. **Revisar tipos de licencias** (ya deberían estar creados)
3. **Configurar disponibilidad** para cada empleado
4. **Crear usuarios adicionales** con roles apropiados

### 4. Crear Más Administradores (Opcional)
1. Ve a **Empleados** → **Nuevo Empleado**
2. Crea empleados con rol admin/manager
3. El sistema creará automáticamente usuarios en Firebase Auth

## 🔧 Comandos Útiles

### Verificar Estado
```bash
# Verificar tipos de licencias
node scripts/check-license-types-simple.cjs

# Verificar conexión Firebase
# Abre test-firebase.html en navegador
```

### Gestión de Usuarios
```bash
# Crear usuario específico
node scripts/create-admin-user.mjs usuario@empresa.com password123 admin

# Cambiar rol de usuario existente
# Ve a Firebase Console → Firestore → users → editar documento
```

### Backup y Restauración
```bash
# Exportar datos
firebase firestore:export backup --project licencias-gestor

# Importar datos
firebase firestore:import backup --project licencias-gestor
```

## 🚨 Solución de Problemas

### Error: "Missing or insufficient permissions"
1. Verifica que las reglas de Firestore estén desplegadas
2. Confirma que el usuario esté autenticado
3. Revisa que el rol del usuario sea correcto

### Error: "Usuario no encontrado en base de datos"
1. El usuario se crea automáticamente al iniciar sesión
2. Si persiste, verifica conexión a Firestore
3. Rol por defecto: 'viewer'

### Error: "No se pueden crear tipos de licencias"
1. Solo usuarios con rol 'admin' o 'super-admin' pueden crear tipos
2. Verifica el rol del usuario actual
3. Los tipos ya deberían estar creados desde la inicialización

## 🔒 Consideraciones de Seguridad

### ✅ Implementado
- Autenticación requerida para todas las operaciones
- Control de acceso basado en roles
- Campos sensibles protegidos
- Reglas de Firestore validadas

### 📋 Recomendaciones Adicionales
- **Habilitar 2FA** en Firebase Console para admins
- **Configurar alertas** de seguridad en Firebase
- **Monitorear logs** de acceso
- **Regular backups** automáticos
- **Auditoría** de cambios críticos

## 📞 Soporte

Si encuentras problemas durante el despliegue:

1. **Verifica logs** en consola del navegador (F12)
2. **Revisa Firebase Console** → Functions/Logs
3. **Verifica reglas** en Firebase Console → Firestore → Rules
4. **Confirma usuarios** en Firebase Console → Authentication

---

## ✅ Checklist Post-Despliegue

- [ ] Reglas de Firestore desplegadas correctamente
- [ ] Usuario administrador creado e inicia sesión
- [ ] Tipos de licencias visibles (15 tipos)
- [ ] Se pueden crear empleados
- [ ] Se pueden crear solicitudes de licencia
- [ ] Roles funcionan correctamente
- [ ] Backup inicial realizado

¡Tu aplicación de gestión de licencias está lista para producción! 🎉
