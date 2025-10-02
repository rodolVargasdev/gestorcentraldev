#!/usr/bin/env node

/**
 * Script para desplegar índices de Firestore
 * Ejecuta: firebase deploy --only firestore:indexes
 */

const { execSync } = require('child_process');

console.log('🔥 Desplegando índices de Firestore...\n');

try {
    // Verificar si Firebase CLI está instalado
    console.log('1️⃣ Verificando Firebase CLI...');
    try {
        execSync('firebase --version', { stdio: 'pipe' });
        console.log('✅ Firebase CLI encontrado');
    } catch (error) {
        console.log('❌ Firebase CLI no encontrado');
        console.log('📦 Instala Firebase CLI con: npm install -g firebase-tools');
        process.exit(1);
    }

    // Verificar si estamos en un proyecto Firebase
    console.log('\n2️⃣ Verificando proyecto Firebase...');
    try {
        const result = execSync('firebase projects:list', { encoding: 'utf8' });
        console.log('✅ Proyecto Firebase configurado');

        // Mostrar proyectos disponibles
        const lines = result.split('\n').filter(line => line.includes('licencias-gestor') || line.includes('final-test-dev'));
        if (lines.length > 0) {
            console.log('📋 Proyectos encontrados:');
            lines.forEach(line => console.log('   ' + line.trim()));
        }
    } catch (error) {
        console.log('❌ No hay proyecto Firebase configurado');
        console.log('🔧 Ejecuta: firebase login && firebase init');
        process.exit(1);
    }

    // Desplegar índices
    console.log('\n3️⃣ Desplegando índices...');
    const deployResult = execSync('firebase deploy --only firestore:indexes', {
        encoding: 'utf8',
        stdio: 'inherit'
    });

    console.log('\n✅ Índices desplegados exitosamente');
    console.log('🎯 Los índices compuestos ahora deberían estar disponibles');

} catch (error) {
    console.error('\n❌ Error desplegando índices:', error.message);
    console.log('\n🔧 Soluciones posibles:');
    console.log('1. Asegúrate de estar logueado: firebase login');
    console.log('2. Verifica que firestore.indexes.json sea válido');
    console.log('3. Confirma que tienes permisos para el proyecto');
    process.exit(1);
}
