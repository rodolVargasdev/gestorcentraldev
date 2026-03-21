# Guia de Configuracion de Integracion y Despliegue Continuo (CI/CD) con Firebase y GitHub Actions

## Objetivo
Este documento sirve como respaldo detallado de los pasos realizados para configurar un flujo de trabajo profesional utilizando Git, GitHub Actions y multiples entornos de Firebase. El proposito es tener una referencia clara en caso de requerir replicar esta arquitectura desde cero en un nuevo repositorio.

## Prerrequisitos
- Tener instalado Node.js y npm.
- Tener instalado Git.
- Tener instalado Firebase CLI de manera global (`npm install -g firebase-tools`).
- Tener acceso de administrador a un repositorio en GitHub.
- Tener cuentas en Firebase / Google Cloud Platform.
- Disponer de al menos dos proyectos creados en la consola de Firebase:
  - Uno exclusivo para Desarrollo/Pruebas.
  - Uno exclusivo para Produccion.

## Paso a Paso para la Configuracion

### 1. Configuracion del Flujo de Ramas (Git Flow)
Para proteger el entorno de produccion, se establece una estrategia de ramas:
- Rama `main`: Codigo de produccion estable. Solo recibe cambios mediante Pull Requests que han sido revisados y probados.
- Rama `develop`: Entorno de desarrollo. Aqui se integran las nuevas funcionalidades (features) y correcciones antes de unirlas a produccion.

Comandos basicos para iniciar la separacion localmente:
```bash
git checkout -b develop
git push -u origin develop
```

### 2. Vinculacion de Entornos de Firebase
El archivo `.firebaserc` en la raiz del proyecto le indica a Firebase CLI a que proyectos reales en la nube debe apuntar, dependiendo del alias que se utilice.

Se debe configurar para separar claramente hacia donde apuntan los comandos de despliegue:
```json
{
  "projects": {
    "default": "id-proyecto-desarrollo",
    "dev": "id-proyecto-desarrollo",
    "prod": "id-proyecto-produccion"
  }
}
```

### 3. Configuracion de GitHub Actions
Se utilizan dos flujos de trabajo (workflows automatizados) ubicados en la carpeta `.github/workflows/`:
1. `firebase-hosting-pull-request.yml`: Se ejecuta automaticamente al crear un Pull Request hacia `main` o `develop`. Crea un canal de vista previa temporal (Preview Channel) en Firebase, devolviendo una URL efimera para probar los cambios antes de aceptarlos.
2. `firebase-hosting-merge.yml`: Se ejecuta automaticamente al hacer merge (fusionar codigo) directamente a la rama `main`. Realiza el despliegue final y permanente a la URL en vivo (produccion).

**Importante:** Para que Vite (la herramienta de construccion de React) pueda empaquetar el proyecto correctamente, es vital inyectar las variables de entorno de Firebase durante el proceso de build en la nube. De lo contrario, los archivos generados estaran vacios de credenciales y no sabran como conectarse a la base de datos.

Ejemplo del paso de inyeccion en los archivos `.yml`:
```yaml
      - run: npm ci && npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
```

### 4. Configuracion de Secretos en GitHub (Repository Secrets)
Debido a que el archivo `.env.local` contiene informacion sensible y esta excluido del control de versiones (via `.gitignore`), los servidores de GitHub necesitan conocer estos valores de otra forma segura.

En el repositorio de GitHub, se debe navegar a **Settings > Secrets and variables > Actions** y crear los siguientes secretos de repositorio (Repository secrets):

#### Variables de Entorno de la Aplicacion (Frontend)
Se obtienen de la configuracion del proyecto web en la consola de Firebase:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

#### Llaves de Servicio (Service Accounts)
Para que GitHub pueda autorizar el despliegue de archivos hacia Firebase Hosting sin intervencion humana, necesita permisos de administrador a nivel de Google Cloud. 
1. Ir a la Consola de Firebase > Configuracion del proyecto > Cuentas de servicio.
2. Hacer clic en "Generar nueva clave privada" (esto descargara un archivo JSON).
3. Copiar todo el texto del archivo JSON y pegarlo como un nuevo secreto en GitHub.
- Ejemplo de nombre: `FIREBASE_SERVICE_ACCOUNT_GESTORCENTRALDEV`

Este secreto es el que se le proporciona al paso final del workflow de GitHub Actions:
```yaml
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_GESTORCENTRALDEV }}
          channelId: live
          projectId: gestorcentraldev
```

## Solucion de Problemas Comunes y Como Evitarlos

### 1. Pantalla en blanco y error: Uncaught FirebaseError: Firebase: Error (auth/invalid-api-key)
- **Por que ocurre:** El proyecto se compilo en los servidores de GitHub Actions, pero las variables de entorno nunca fueron inyectadas. Vite genera los archivos estaticos correctamente, pero el SDK de Firebase falla inmediatamente al no encontrar una `apiKey` valida para inicializarse.
- **Como evitarlo / solucionarlo:** 
  1. Asegurarse de que el paso `npm run build` en el archivo YAML de GitHub Actions incluya el bloque `env:` mapeando los secretos de GitHub a las variables locales. 
  2. Verificar estrictamente que los nombres de los secretos esten escritos correctamente en la seccion Settings del repositorio de GitHub. 
  3. Si se corrige, es necesario volver a ejecutar el proceso haciendo clic en "Re-run all jobs" dentro de la accion fallida en GitHub, o hacer un nuevo push.

### 2. Error en GitHub al hacer push: Push cannot contain secrets (GitHub Push Protection)
- **Por que ocurre:** El sistema de seguridad de GitHub detecta que se esta intentando subir (push) un archivo que contiene llaves privadas reales (como el JSON descargado de la cuenta de servicio de Firebase). GitHub bloquea la accion para evitar la filtracion de datos sensibles al publico.
- **Como evitarlo / solucionarlo:** 
  1. Nunca ejecutar `git add .` ciegamente sin revisar que archivos se estan incluyendo.
  2. Agregar siempre la extension `*.json` (o el nombre especifico del archivo de credenciales) al archivo `.gitignore` **antes** de hacer el primer commit.
  3. Si el archivo ya se agrego al area de staging localmente por accidente, se debe remover del historial antes de intentar empujar de nuevo:
     ```bash
     # Sacar el archivo del rastreo de git sin borrarlo de la computadora
     git rm --cached nombre-del-archivo-credenciales.json
     
     # Reescribir el ultimo commit para limpiarlo
     git commit --amend -m "Mensaje del commit corregido"
     ```

## Consideraciones Finales sobre la Arquitectura
- Manten siempre una estricta separacion de bases de datos. Los datos insertados durante las pruebas en el entorno de desarrollo nunca deben cruzarse con el proyecto configurado como produccion.
- Si en el futuro se desea tener despliegues verdaderamente paralelos (donde `develop` despliega automaticamente a un proyecto de Firebase A y `main` despliega a un proyecto de Firebase B), es necesario:
  1. Crear dos llaves de servicio (una de cada proyecto) y guardarlas como dos secretos distintos en GitHub.
  2. Modificar la logica de los archivos YAML para que, dependiendo de la rama que dispare la accion, se utilice dinamicamente un `projectId` u otro.