const fs = require('fs');

const original = JSON.parse(fs.readFileSync('original.json', 'utf8'));
const translated = JSON.parse(fs.readFileSync('translated.json', 'utf8'));

const reordered = {};
Object.keys(original).forEach(key => {
    if (translated[key] !== undefined) {
        reordered[key] = translated[key];
    }
});

fs.writeFileSync('translated_reordered.json', JSON.stringify(reordered, null, 2), 'utf8');
console.log('Fichier réorganisé.');
