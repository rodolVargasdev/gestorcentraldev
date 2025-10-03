# 🚀 Guía Paso a Paso - Deploy a Firebase

## ✅ Configuración Completada

Ya he configurado tu proyecto con las credenciales correctas:
- **Project ID**: `licencias-gestor`
- **Auth Domain**: `licencias-gestor.firebaseapp.com`
- ✅ Build de producción generado en carpeta `dist/`

---

## 📋 Pasos para Desplegar

### Paso 1: Instalar Firebase CLI (si no lo tienes)

```bash
npm install -g firebase-tools
```

### Paso 2: Autenticarte en Firebase

```bash
firebase login
```

Esto abrirá tu navegador para autenticarte con tu cuenta de Google.

### Paso 3: Verificar el Proyecto Configurado

```bash
firebase projects:list
```

Deberías ver `licencias-gestor` en la lista.

### Paso 4: Verificar Configuración Local

```bash
firebase use
```

Debería mostrar: `Active Project: licencias-gestor`

Si no está activo, ejecuta:
```bash
firebase use licencias-gestor
```

### Paso 5: Desplegar Reglas de Firestore e Índices

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Esto configurará:
- ✅ Reglas de seguridad de Firestore
- ✅ Índices necesarios para las consultas

### Paso 6: Desplegar la Aplicación

```bash
firebase deploy --only hosting
```

Esto subirá tu aplicación a Firebase Hosting.

### Paso 7: Deploy Completo (Opcional - Todo de una vez)

Si prefieres desplegar todo de una vez:

```bash
firebase deploy
```

---

## 🔧 Configuración Inicial de Firebase Console

### A. Habilitar Authentication

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto `licencias-gestor`
3. Ve a **Authentication** → **Sign-in method**
4. Habilita **Email/Password**

### B. Configurar Firestore Database

1. Ve a **Firestore Database**
2. Si no existe, créala con:
   - Modo: **Producción**
   - Ubicación: **nam5** (North America)

### C. Verificar Hosting

1. Ve a **Hosting**
2. Después del deploy, tu aplicación estará en:
   ```
   https://licencias-gestor.web.app
   o
   https://licencias-gestor.firebaseapp.com
   ```

---

## 🎯 Inicialización de Datos

Después del primer deploy, necesitas inicializar los tipos de licencias:

### Opción 1: Automático (Recomendado)
La aplicación inicializará automáticamente los tipos de licencias al abrirse por primera vez.

### Opción 2: Manual con Scripts

```bash
# Inicializar tipos de licencias
node scripts/initialize-license-types.mjs

# Crear usuario administrador
node scripts/create-admin-user.mjs admin@tuempresa.com TuPassword123 super-admin
```

---

## 🔐 Crear Primer Usuario Administrador

### Método 1: Desde Firebase Console

1. Ve a **Authentication** → **Users**
2. Clic en **Add user**
3. Email: `admin@tuempresa.com`
4. Password: tu contraseña segura
5. Luego ve a **Firestore Database**
6. Crea un documento en la colección `users`:
   ```
   Document ID: [el UID del usuario]
   Campos:
   - email: "admin@tuempresa.com"
   - role: "super-admin"
   - createdAt: [timestamp actual]
   ```

### Método 2: Con Script (después de configurar Firebase CLI)

```bash
node scripts/create-admin-user.mjs admin@tuempresa.com MiPassword123 super-admin
```

---

## ✅ Verificación Post-Deploy

### 1. Verificar que la aplicación está online
```bash
firebase hosting:channel:open live
```

### 2. Probar Login
- Abre la URL de tu aplicación
- Intenta iniciar sesión con el usuario admin que creaste
- Deberías ver el dashboard

### 3. Verificar Tipos de Licencias
- Ve a la sección de licencias
- Deberías ver los 16 tipos de licencias configurados

---

## 🐛 Solución de Problemas

### Error: "Firebase CLI not found"
```bash
npm install -g firebase-tools
```

### Error: "Permission denied"
```bash
# Reautenticarse
firebase logout
firebase login
```

### Error: "Project not found"
```bash
# Verificar proyectos disponibles
firebase projects:list

# Seleccionar el proyecto correcto
firebase use licencias-gestor
```

### Error: "Missing or insufficient permissions" en la app
- Verifica que las reglas de Firestore estén desplegadas
- Verifica que el usuario esté autenticado
- Verifica que el usuario tenga el rol correcto en Firestore

---

## 📊 Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo local (puerto 5173) |
| `npm run build` | Construir para producción |
| `npm run preview` | Preview del build local |
| `firebase deploy` | Desplegar todo |
| `firebase deploy --only hosting` | Solo hosting |
| `firebase deploy --only firestore` | Solo Firestore |
| `firebase hosting:channel:list` | Ver canales de hosting |
| `firebase projects:list` | Ver tus proyectos |

---

## 🎉 ¡Listo para Usar!

Después de seguir estos pasos, tu aplicación estará completamente funcional en:

**URL de Producción:** `https://licencias-gestor.web.app`

### Funcionalidades Disponibles:
✅ Sistema de autenticación con Firebase Auth
✅ Gestión completa de empleados
✅ 16 tipos de licencias configuradas
✅ Solicitud y aprobación de licencias
✅ Historial completo de permisos
✅ Dashboard con métricas
✅ Importación/Exportación CSV/Excel
✅ Disponibilidad en tiempo real

---

## 📞 Siguientes Pasos Recomendados

1. **Crear usuarios adicionales** desde la aplicación
2. **Importar empleados** usando CSV/Excel
3. **Configurar disponibilidad** para cada empleado
4. **Probar el flujo completo** de solicitud de licencias
5. **Configurar backups automáticos** en Firebase Console

---

## 📖 Documentación Adicional

- `README.md` - Documentación completa del proyecto
- `DEPLOYMENT_GUIDE.md` - Guía detallada de despliegue
- `PRODUCTION_DEPLOYMENT.md` - Configuración de producción
- Scripts en `scripts/` - Utilidades de inicialización


