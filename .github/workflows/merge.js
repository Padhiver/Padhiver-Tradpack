const fs = require('fs');
const merge = require('deepmerge');
const yaml = require('js-yaml');
const path = require('path');

// Lire tous les dossiers dans ./translations
const modules = fs.readdirSync('./translations').filter(dir => 
  fs.statSync(path.join('./translations', dir)).isDirectory()
);

let allTranslations = {};

for (const moduleName of modules) {
  const frPath = path.join('./translations', moduleName, 'fr.json');
  
  if (fs.existsSync(frPath)) {
    const translation = JSON.parse(fs.readFileSync(frPath, 'utf8'));
    allTranslations = merge(allTranslations, translation);
  }
}

fs.writeFileSync('./fr.json', JSON.stringify(allTranslations, null, 2));