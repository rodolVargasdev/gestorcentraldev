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
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_GESTORCENTRALSTG }}
          channelId: live
          projectId: gestorcentralstg
```

---

## 5. Secretos en GitHub: nombres exactos y que valor poner en cada uno

### Por que existen estos secretos
GitHub Actions ejecuta `npm run build` en la nube **sin** tu archivo `.env.local` (no se sube al repo). Por eso hay que definir **Repository secrets** con los mismos datos que usarias en local. Ademas, la accion `FirebaseExtended/action-hosting-deploy` necesita el **JSON completo de la cuenta de servicio** de Firebase para poder subir archivos a Hosting; si falta ese secret, el error tipico es: `Input required and not supplied: firebaseServiceAccount`.

### Donde crearlos
En el repositorio: **Settings > Secrets and variables > Actions > New repository secret**.

**No** debes crear manualmente `GITHUB_TOKEN`: GitHub lo inyecta solo en los workflows.

### Donde obtener los valores (Firebase Console)
Para **cada** proyecto Firebase (dev, stg, prd):

1. **Configuracion del proyecto** (icono de engranaje) > pestana **General**.
2. Baja hasta **Tus apps** y selecciona la app **Web** (`</>`). Si no existe, creala.
3. En el snippet de configuracion veras campos como `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`. Esos son los valores de los secretos `VITE_FIREBASE_*` del ambiente correspondiente (uno por fila en las tablas de abajo).

Para el **JSON de cuenta de servicio** (un solo secret por ambiente):

1. Misma **Configuracion del proyecto** > **Cuentas de servicio**.
2. **Generar nueva clave privada** (descarga un archivo `.json`).
3. Abre el archivo y copia **todo el contenido** desde la primera `{` hasta la ultima `}`.
4. Pegalo **entero** en el secret `FIREBASE_SERVICE_ACCOUNT_*` de esa fila. Sin comillas envolventes adicionales, sin cortar lineas.

### Reglas para no fallar
- El **nombre** del secret en GitHub debe coincidir **literalmente** con el del workflow (mayusculas, guiones bajos).
- Los valores `VITE_*` son **texto plano** (una linea por secret).
- El valor de `FIREBASE_SERVICE_ACCOUNT_*` es **un JSON multilinea** en un solo secret (GitHub lo admite).
- Si falta cualquier `VITE_*` en el build, la app puede compilar con variables vacias y en el navegador aparecera `auth/invalid-api-key`.

---

### 5.1 Ambiente DEV (preview en Pull Request)
**Workflow:** `.github/workflows/deploy-preview.yml`  
**Proyecto Firebase en el YAML:** `gestorcentraldev`

| Nombre exacto del secret | Que pegar |
|--------------------------|-----------|
| `VITE_FIREBASE_API_KEY_DEV` | Valor de **apiKey** de la app web del proyecto **gestorcentraldev** |
| `VITE_FIREBASE_AUTH_DOMAIN_DEV` | **authDomain** |
| `VITE_FIREBASE_PROJECT_ID_DEV` | **projectId** (debe ser `gestorcentraldev`) |
| `VITE_FIREBASE_STORAGE_BUCKET_DEV` | **storageBucket** |
| `VITE_FIREBASE_MESSAGING_SENDER_ID_DEV` | **messagingSenderId** |
| `VITE_FIREBASE_APP_ID_DEV` | **appId** |
| `FIREBASE_SERVICE_ACCOUNT_GESTORCENTRALDEV` | Contenido **completo** del JSON de cuenta de servicio de **gestorcentraldev** |

**Cuando corre:** al abrir o actualizar un **Pull Request** (despliega un canal de vista previa en ese proyecto).

---

### 5.2 Ambiente STG (Staging)
**Workflow:** `.github/workflows/deploy-staging.yml`  
**Rama que lo dispara:** `staging` (push)  
**Proyecto Firebase en el YAML:** `gestorcentralstg`

| Nombre exacto del secret | Que pegar |
|--------------------------|-----------|
| `VITE_FIREBASE_API_KEY_STG` | **apiKey** de la app web de **gestorcentralstg** |
| `VITE_FIREBASE_AUTH_DOMAIN_STG` | **authDomain** |
| `VITE_FIREBASE_PROJECT_ID_STG` | **projectId** (debe ser `gestorcentralstg`) |
| `VITE_FIREBASE_STORAGE_BUCKET_STG` | **storageBucket** |
| `VITE_FIREBASE_MESSAGING_SENDER_ID_STG` | **messagingSenderId** |
| `VITE_FIREBASE_APP_ID_STG` | **appId** |
| `FIREBASE_SERVICE_ACCOUNT_GESTORCENTRALSTG` | Contenido **completo** del JSON de cuenta de servicio de **gestorcentralstg** |

**Cuando corre:** cada **push** a la rama `staging` (deploy a Hosting "live" de ese proyecto).

---

### 5.3 Ambiente PRD (Produccion)
**Workflow:** `.github/workflows/deploy-production.yml`  
**Rama que lo dispara:** `main` (push)  
**Proyecto Firebase en el YAML:** `g-license-mgr-dev-gsv000-015`

| Nombre exacto del secret | Que pegar |
|--------------------------|-----------|
| `VITE_FIREBASE_API_KEY_PRD` | **apiKey** de la app web de **g-license-mgr-dev-gsv000-015** |
| `VITE_FIREBASE_AUTH_DOMAIN_PRD` | **authDomain** |
| `VITE_FIREBASE_PROJECT_ID_PRD` | **projectId** (debe ser `g-license-mgr-dev-gsv000-015`) |
| `VITE_FIREBASE_STORAGE_BUCKET_PRD` | **storageBucket** |
| `VITE_FIREBASE_MESSAGING_SENDER_ID_PRD` | **messagingSenderId** |
| `VITE_FIREBASE_APP_ID_PRD` | **appId** |
| `FIREBASE_SERVICE_ACCOUNT_GLICENSE_PRD` | Contenido **completo** del JSON de cuenta de servicio de **g-license-mgr-dev-gsv000-015** |

**Cuando corre:** cada **push** a `main`. Conviene proteger la rama y exigir PR + revision antes de mergear.

---

### 5.4 Relacion con el desarrollo local
Tu `.env.local` en la raiz del repo debe usar las mismas claves `VITE_FIREBASE_*` **sin** sufijo `_DEV` (son las del proyecto en el que trabajes cada dia, normalmente dev). Los workflows **no** leen `.env.local`; solo los **secrets** de GitHub con sufijo `_DEV`, `_STG` o `_PRD`.

### 5.5 Tras configurar o corregir secretos
En **Actions**, abre el workflow fallido y usa **Re-run jobs** para volver a ejecutar sin necesidad de un commit nuevo.

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

### 4. Error: Input required and not supplied: firebaseServiceAccount
Significa que el workflow referencia `secrets.FIREBASE_SERVICE_ACCOUNT_...` pero ese secret **no existe** en el repositorio o el nombre no coincide **caracter por caracter** con el del YAML.

1. Identifica **que workflow fallo** (preview, staging o production) segun la pestana **Actions**.
2. Abre el `.yml` correspondiente en `.github/workflows/` y mira el valor exacto de `firebaseServiceAccount: ${{ secrets.NOMBRE }}`.
3. Crea en GitHub un secret con ese **NOMBRE** y pega el JSON completo de la cuenta de servicio del **mismo** `projectId` que declara ese workflow.
4. Consulta la **seccion 5** de este documento para la tabla de nombres y proyectos.

### Scripts Node y datos de prueba
Cualquier script bajo `scripts/` o `src/scripts/` que use Firebase debe ejecutarse desde la raiz del proyecto con `.env.local` configurado (mismas variables `VITE_FIREBASE_*` que la app). Si faltan variables, el script fallara con un mensaje explicito en lugar de usar credenciales embebidas.