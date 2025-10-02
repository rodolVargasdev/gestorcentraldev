# Script para subir cambios a ambos repositorios
Write-Host "🚀 Configurando repositorios remotos..." -ForegroundColor Green

Write-Host "📋 Verificando estado actual..." -ForegroundColor Yellow
git status

Write-Host "🔧 Agregando repositorios remotos..." -ForegroundColor Yellow
git remote add goes-infra https://github.com/goes-infraestructura/gestor-licencias-frontend.git
git remote add rodol https://github.com/rodolVargasdev/gestor-firebase.git

Write-Host "📋 Verificando repositorios configurados..." -ForegroundColor Yellow
git remote -v

Write-Host "📦 Agregando todos los cambios..." -ForegroundColor Yellow
git add .

Write-Host "💾 Haciendo commit con las mejoras..." -ForegroundColor Yellow
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

Write-Host "🚀 Push a goes-infraestructura..." -ForegroundColor Green
git push goes-infra main

Write-Host "🚀 Push a rodolVargasdev..." -ForegroundColor Green  
git push rodol main

Write-Host "✅ ¡Subida completada a ambos repositorios!" -ForegroundColor Green
Read-Host "Presiona Enter para continuar"
