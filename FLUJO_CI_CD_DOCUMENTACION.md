# Guia de Configuracion de Arquitectura (Dev, Stg, Prod) y CI/CD con Firebase y GitHub Actions

## Objetivo
Este documento sirve como respaldo detallado de los pasos realizados para configurar un flujo de trabajo profesional utilizando Git, GitHub Actions y multiples entornos de Firebase. El proposito es tener una referencia clara en caso de requerir replicar esta arquitectura desde cero en un nuevo repositorio.

## Arquitectura de 3 Ambientes
El estandar implementado contempla 3 niveles de despliegue para garantizar la calidad y seguridad del producto:
1. **DEV (Desarrollo):** Entorno de pruebas tecnicas conectado a la rama `develop`. Utilizado exclusivamente por programadores.
2. **STG (Staging/Pre-produccion):** Clon exacto de produccion conectado a la rama `staging`. Utilizado para QA (Quality Assurance) y pruebas de aceptacion de usuario (UAT).
3. **PRD (Produccion):** Entorno final de los usuarios conectado a la rama `main`. Solo recibe codigo que ya fue aprobado en Staging.

---

## 1. Configuracion Inicial de Proyectos en Firebase
Antes de tocar el codigo, se deben crear los 3 proyectos en Google Cloud / Firebase Console.

### Creacion y Configuracion por cada entorno (repetir 3 veces)
1. Ir a la consola de Firebase y crear el proyecto (ej. `proyecto-dev`, `proyecto-stg`, `proyecto-prd`).
2. Habilitar **Authentication**: Activar metodo de Email/Password.
3. Habilitar **Firestore Database**: Crear base de datos (se recomienda usar siempre la misma region, ej. `nam5`).
4. Habilitar **Hosting**: Simplemente iniciar el servicio.
5. **Registrar Aplicacion Web (Frontend):**
   - Ir a Configuracion del Proyecto > Tus apps.
   - Crear aplicacion Web.
   - Copiar el bloque de configuracion (`firebaseConfig`) que contiene llaves como `apiKey`, `projectId`, etc.
6. **Generar Cuenta de Servicio (Backend/CI-CD):**
   - Ir a Configuracion del Proyecto > Cuentas de servicio.
   - Clic en "Generar nueva clave privada" y guardar el archivo JSON.

---

## 2. Configuracion del Flujo de Ramas (Git Flow)
Para proteger el entorno de produccion, se establece una estrategia estricta de ramas locales.

```bash
# Inicializar repositorio y subir la rama principal (PRD)
git branch -M main
git push -u origin main

# Crear y subir rama de Staging (STG)
git checkout -b staging
git push -u origin staging

# Crear y subir rama de Desarrollo (DEV)
git checkout -b develop
git push -u origin develop
```
*Regla de oro:* Todo desarrollo inicia creando una rama `feature/nombre` desde `develop`. Una vez terminada, se integra a `develop`. Al finalizar el ciclo de desarrollo (sprint), `develop` se une a `staging`. Al ser aprobado, `staging` se une a `main`.

---

## 3. Vinculacion de Entornos Locales de Firebase
El archivo `.firebaserc` en la raiz del proyecto le indica a Firebase CLI a que proyectos reales en la nube debe apuntar, dependiendo del alias.

```json
{
  "projects": {
    "default": "id-proyecto-dev",
    "dev": "id-proyecto-dev",
    "stg": "id-proyecto-stg",
    "prod": "id-proyecto-prd"
  }
}
```

---

## 4. Configuracion de GitHub Actions (Automatizacion)
Se establecen 3 flujos de trabajo en `.github/workflows/` para manejar automaticamente los despliegues de cada entorno sin intervencion manual.

### A. Deploy Preview (Entorno DEV)
Archivo: `deploy-preview.yml`. Se ejecuta automaticamente al crear un Pull Request hacia `develop` o `main`. Despliega a una URL temporal utilizando el entorno de desarrollo.
*Utiliza los secretos de GitHub terminados en `_DEV`.*

### B. Deploy Staging (Entorno STG)
Archivo: `deploy-staging.yml`. Se ejecuta automaticamente al hacer merge (fusionar codigo) en la rama `staging`. Despliega a la URL real de staging.
*Utiliza los secretos de GitHub terminados en `_STG`.*

### C. Deploy Production (Entorno PRD)
Archivo: `deploy-production.yml`. Se ejecuta automaticamente al hacer merge en la rama `main`. Despliega al entorno oficial de produccion.
*Utiliza los secretos de GitHub terminados en `_PRD`.*

**Paso de Inyeccion de Variables:**
Para que Vite (herramienta de construccion) funcione, las variables deben inyectarse en el paso de build (ejemplo del entorno staging):
```yaml
      - run: npm ci && npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY_STG }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN_STG }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID_STG }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET_STG }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID_STG }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID_STG }}
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_STG }}
          channelId: live
          projectId: id-proyecto-stg
```

---

## 5. Configuracion de Secretos en GitHub (Repository Secrets)
Debido a que el archivo `.env.local` esta excluido del control de versiones (via `.gitignore`), los servidores de GitHub necesitan conocer estos valores.

En el repositorio de GitHub > **Settings > Secrets and variables > Actions**, se deben crear 3 bloques de secretos (uno por ambiente):

#### Variables del Frontend (Multiplicadas por _DEV, _STG, _PRD)
- `VITE_FIREBASE_API_KEY_DEV` / `_STG` / `_PRD`
- `VITE_FIREBASE_AUTH_DOMAIN_DEV` / `_STG` / `_PRD`
- `VITE_FIREBASE_PROJECT_ID_DEV` / `_STG` / `_PRD`
- `VITE_FIREBASE_STORAGE_BUCKET_DEV` / `_STG` / `_PRD`
- `VITE_FIREBASE_MESSAGING_SENDER_ID_DEV` / `_STG` / `_PRD`
- `VITE_FIREBASE_APP_ID_DEV` / `_STG` / `_PRD`

#### Llaves de Servicio (Cuentas de Servicio JSON)
El contenido integro de cada archivo JSON descargado desde Google Cloud IAM:
- `FIREBASE_SERVICE_ACCOUNT_DEV`
- `FIREBASE_SERVICE_ACCOUNT_STG`
- `FIREBASE_SERVICE_ACCOUNT_PRD`

---

## Solucion de Problemas Comunes y Evitacion de Errores

### 1. Manejo seguro de credenciales (CRITICO)
**El Riesgo:** Subir por error los archivos JSON descargados de Firebase (`firebase-adminsdk...json`) puede resultar en la vulneracion de la base de datos completa. GitHub bloqueara automaticamente el push ("Push cannot contain secrets").
**La Solucion Prevencion:** 
Asegurarse de que el archivo `.gitignore` contenga reglas estrictas para omitir estos archivos **antes de hacer cualquier commit**:
```gitignore
# Firebase credentials
firebase-credentials.json
service-account-key.json
firebase-adminsdk-*.json
*-firebase-adminsdk-*.json
```
Si el archivo ya se agrego por accidente a la cola de git (stage):
```bash
git rm --cached nombre-archivo.json
git commit --amend -m "chore: remove credentials"
```

### 2. Alertas de Secret scanning (API keys de Google en el historial)
GitHub puede marcar como filtracion publica cualquier cadena que coincida con el formato de **Google API Key** (por ejemplo en `*.ts`, `*.js`, `*.html`, `*.cjs`).

**Que hicimos en el codigo:**
- La app web ya usa `src/lib/firebase.config.ts` con `import.meta.env.VITE_*` (sin claves en el repositorio).
- Scripts de Node y paginas de prueba usan `scripts/lib/firebase-env.cjs` o `src/scripts/firebaseEnvForScripts.ts`, leyendo **solo** `.env.local` / `.env`.
- `test-firebase.html` quedo con placeholders; para probar en local, edita el archivo **sin commitear** o usa una copia local ignorada.

**Que debes hacer si las alertas siguen abiertas:**
1. Tras subir los cambios, en GitHub revisa **Security > Secret scanning** y cierra o marca como resuelto segun la guia de GitHub (si el secreto ya no esta en la rama por defecto).
2. Si la clave **alguna vez** estuvo en un commit publico, asume que quedo expuesta: en **Google Cloud Console** (APIs y servicios > Credenciales) **restringe** la API key o **crea una nueva** y actualiza `.env.local` y los secretos de GitHub Actions.
3. Para borrar el secreto del **historial** de Git (commits viejos), hace falta `git filter-repo` o BFG y un force-push; es operacion delicada. Lo habitual es **rotar la clave** y dejar el historial como referencia interna.

### 3. Pantalla en blanco en produccion o pre-produccion
- **Por que ocurre:** Error `Uncaught FirebaseError: Firebase: Error (auth/invalid-api-key)`. Vite empaqueto el codigo (en GitHub Actions) sin recibir variables de entorno. 
- **Como solucionarlo:** 
  1. Verificar que el archivo `deploy-*.yml` de ese entorno tenga el bloque `env:` en el paso de build.
  2. Comprobar que los nombres de los secretos en el YAML coincidan EXACTAMENTE (sensible a mayusculas) con los nombres de los secretos guardados en GitHub Settings.
  3. Ejecutar de nuevo el flujo haciendo clic en "Re-run all jobs" en GitHub.

### Scripts Node y datos de prueba
Cualquier script bajo `scripts/` o `src/scripts/` que use Firebase debe ejecutarse desde la raiz del proyecto con `.env.local` configurado (mismas variables `VITE_FIREBASE_*` que la app). Si faltan variables, el script fallara con un mensaje explicito en lugar de usar credenciales embebidas.