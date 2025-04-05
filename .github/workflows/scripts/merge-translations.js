const fs = require('fs');
const merge = require('deepmerge');
const path = require('path');

// Lire tous les dossiers dans ./translations
const modules = fs.readdirSync('./translations').filter(dir => 
  fs.statSync(path.join('./translations', dir)).isDirectory()
);

let allTranslations = {};

// Fonction pour traiter les fichiers JSON et YAML
function processTranslationFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Erreur lors de la lecture du fichier ${filePath}:`, error);
    return {};
  }
}

// Fusionner toutes les traductions
for (const moduleName of modules) {
  const frPath = path.join('./translations', moduleName, 'fr.json');
  
  if (fs.existsSync(frPath)) {
    const translation = processTranslationFile(frPath);
    allTranslations = merge(allTranslations, translation);
  }
}

// Écrire le fichier fusionné
fs.writeFileSync('./fr.json', JSON.stringify(allTranslations, null, 2));
console.log("Fusion des traductions terminée: fr.json créé avec succès.");