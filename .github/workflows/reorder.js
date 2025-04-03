const fs = require('fs');
const path = require('path');

function reorderFile(originalPath, translatedPath, outputPath) {
    try {
        const original = JSON.parse(fs.readFileSync(originalPath, 'utf8'));
        const translated = JSON.parse(fs.readFileSync(translatedPath, 'utf8'));

        const reordered = {};
        Object.keys(original).forEach(key => {
            if (translated[key] !== undefined) {
                reordered[key] = translated[key];
            }
        });

        fs.writeFileSync(outputPath, JSON.stringify(reordered, null, 2), 'utf8');
        console.log(`Fichier réorganisé: ${outputPath}`);
    } catch (error) {
        console.error(`Erreur lors du traitement de ${translatedPath}:`, error);
    }
}

// Traite tous les fichiers fr.json dans translations/
const translationsDir = './translations';
const modules = fs.readdirSync(translationsDir).filter(dir => 
    fs.statSync(path.join(translationsDir, dir)).isDirectory()
);

for (const moduleName of modules) {
    const enPath = path.join(translationsDir, moduleName, 'en.json');
    const frPath = path.join(translationsDir, moduleName, 'fr.json');
    const outputPath = path.join(translationsDir, moduleName, 'fr_reordered.json');
    
    if (fs.existsSync(enPath) && fs.existsSync(frPath)) {
        reorderFile(enPath, frPath, outputPath);
    }
}