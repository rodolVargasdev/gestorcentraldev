#!/usr/bin/env node

/**
 * Script para corregir la configuración del proyecto Firebase
 * y desplegar índices correctamente
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigiendo configuración de proyecto Firebase...\n');

try {
    // 1. Verificar Firebase CLI
    console.log('1️⃣ Verificando Firebase CLI...');
    try {
        execSync('firebase --version', { stdio: 'pipe' });
        console.log('✅ Firebase CLI encontrado');
    } catch (error) {
        console.log('❌ Firebase CLI no encontrado');
        console.log('📦 Instala con: npm install -g firebase-tools');
        process.exit(1);
    }

    // 2. Verificar/cambiar .firebaserc
    console.log('\n2️⃣ Verificando configuración de proyecto...');
    const firebasercPath = path.join(process.cwd(), '.firebaserc');

    if (fs.existsSync(firebasercPath)) {
        const firebaserc = JSON.parse(fs.readFileSync(firebasercPath, 'utf8'));
        console.log('📋 Proyecto actual:', firebaserc.projects?.default || 'No definido');

        if (firebaserc.projects?.default !== 'licencias-gestor') {
            console.log('🔄 Cambiando proyecto por defecto a "licencias-gestor"...');
            firebaserc.projects = { default: 'licencias-gestor' };
            fs.writeFileSync(firebasercPath, JSON.stringify(firebaserc, null, 2));
            console.log('✅ Proyecto actualizado en .firebaserc');
        } else {
            console.log('✅ Proyecto ya configurado correctamente');
        }
    } else {
        console.log('📝 Creando archivo .firebaserc...');
        const firebaserc = { projects: { default: 'licencias-gestor' } };
        fs.writeFileSync(firebasercPath, JSON.stringify(firebaserc, null, 2));
        console.log('✅ Archivo .firebaserc creado');
    }

    // 3. Verificar proyectos disponibles
    console.log('\n3️⃣ Verificando proyectos disponibles...');
    try {
        const result = execSync('firebase projects:list --json', { encoding: 'utf8' });
        const projects = JSON.parse(result);
        const availableProjects = projects.result.map(p => p.projectId);

        console.log('📋 Proyectos disponibles:');
        availableProjects.forEach(project => console.log(`   - ${project}`));

        if (!availableProjects.includes('licencias-gestor')) {
            console.log('❌ Proyecto "licencias-gestor" no encontrado');
            console.log('🔧 Verifica que tengas acceso al proyecto correcto');
            process.exit(1);
        }

        console.log('✅ Proyecto "licencias-gestor" disponible');
    } catch (error) {
        console.log('❌ Error obteniendo lista de proyectos');
        console.log('🔧 Ejecuta: firebase login');
        process.exit(1);
    }

    // 4. Desplegar índices
    console.log('\n4️⃣ Desplegando índices de Firestore...');
    try {
        execSync('firebase deploy --only firestore:indexes', { stdio: 'inherit' });
        console.log('\n✅ Índices desplegados exitosamente');
        console.log('🎯 El historial de licencias ahora debería funcionar correctamente');
    } catch (error) {
        console.log('\n❌ Error desplegando índices:', error.message);
        console.log('\n🔧 Soluciones alternativas:');
        console.log('1. Ve a Firebase Console > Firestore > Índices');
        console.log('2. Crea un índice compuesto manualmente:');
        console.log('   - Collection: licenseRequests');
        console.log('   - Campos: employeeId (Ascendente), createdAt (Descendente)');
        process.exit(1);
    }

} catch (error) {
    console.error('\n❌ Error general:', error.message);
    process.exit(1);
}
