@echo off
echo ========================================
echo 🚀 CONFIGURACIÓN PARA PRODUCCIÓN
echo ========================================
echo.

echo 📋 PASO 1: Desplegar reglas de seguridad...
echo.

firebase --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Firebase CLI no está instalado
    echo 🔧 Instala con: npm install -g firebase-tools
    echo 🔑 Luego ejecuta: firebase login
    pause
    exit /b 1
)

firebase use licencias-gestor
if errorlevel 1 (
    echo ❌ Error cambiando proyecto
    pause
    exit /b 1
)

firebase deploy --only firestore:rules
if errorlevel 1 (
    echo ❌ Error desplegando reglas
    pause
    exit /b 1
)

echo.
echo ✅ Reglas de seguridad desplegadas
echo.

echo 📋 PASO 2: Crear usuario administrador...
echo.

set /p ADMIN_EMAIL="Ingresa email del administrador: "
set /p ADMIN_PASS="Ingresa contraseña (min 6 caracteres): "

node scripts/create-admin-user.mjs "%ADMIN_EMAIL%" "%ADMIN_PASS%" "super-admin"

if errorlevel 1 (
    echo ❌ Error creando usuario administrador
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ CONFIGURACIÓN COMPLETADA
echo ========================================
echo.
echo 🔒 Reglas de seguridad activas
echo 👤 Usuario administrador creado
echo 📧 Email: %ADMIN_EMAIL%
echo 🔑 Password: %ADMIN_PASS%
echo.
echo 🚀 La aplicación está lista para producción
echo.
echo 📋 Próximos pasos:
echo 1. Ejecuta: npm run dev
echo 2. Inicia sesión con las credenciales arriba
echo 3. Configura empleados y permisos
echo.
pause
