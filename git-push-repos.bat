@echo off
echo 🚀 Configurando repositorios remotos...

echo 📋 Verificando estado actual...
git status

echo 🔧 Agregando repositorios remotos...
git remote add goes-infra https://github.com/goes-infraestructura/gestor-licencias-frontend.git
git remote add rodol https://github.com/rodolVargasdev/gestor-firebase.git

echo 📋 Verificando repositorios configurados...
git remote -v

echo 📦 Agregando todos los cambios...
git add .

echo 💾 Haciendo commit con las mejoras...
git commit -m "✨ Mejoras completas del sistema

- ✅ Sistema de servicio profesional implementado
- ✅ Vacaciones acumulativas (VGA12) con 15 días
- ✅ Botones de reset global de disponibilidad
- ✅ Filtrado automático de permisos por tipo de empleado
- ✅ Identificador visual SP para empleados de servicio profesional
- ✅ Inicialización automática de tipos de licencias
- ✅ Documentación completa y guías de instalación
- ✅ Scripts de deploy automático
- ✅ Corrección de errores de historial y disponibilidad
- ✅ Reglas de seguridad actualizadas hasta 2025"

echo 🚀 Push a goes-infraestructura...
git push goes-infra main

echo 🚀 Push a rodolVargasdev...
git push rodol main

echo ✅ ¡Subida completada a ambos repositorios!
pause
