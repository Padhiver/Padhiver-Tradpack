const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yamlParser = require('js-yaml');

// Créer le répertoire translations s'il n'existe pas
const translationsDir = './translations';
if (!fs.existsSync(translationsDir)) {
  fs.mkdirSync(translationsDir, { recursive: true });
}

// Télécharger un fichier depuis une URL
async function download(url, dest) {
  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      timeout: 10000 // Timeout de 10 secondes
    });

    const writer = fs.createWriteStream(dest);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Erreur lors du téléchargement de ${url}: ${error.message}`);
    throw error;
  }
}

// Traiter le contenu d'un fichier selon son extension
function writeEmptyFile(filePath, ext) {
  if (ext === 'yml' || ext === 'yaml') {
    fs.writeFileSync(filePath, '{}');
  } else {
    fs.writeFileSync(filePath, '{}');
  }
}

async function main() {
  try {
    // Charger le fichier projects.json
    if (!fs.existsSync('./projects.json')) {
      console.error('Fichier projects.json introuvable');
      process.exit(1);
    }

    const projects = JSON.parse(fs.readFileSync('./projects.json', 'utf8'));
    const projectsArray = Array.isArray(projects) ? projects : [projects];

    console.log(`Traitement de ${projectsArray.length} projets...`);

    for (const project of projectsArray) {
      if (!project.src || !project.name) {
        console.warn('Projet invalide, ignoré:', project);
        continue;
      }

      // Déterminer l'extension du fichier source
      const urlParts = project.src.split('.');
      const ext = urlParts[urlParts.length - 1].toLowerCase();
      const validExt = ['json', 'yml', 'yaml'].includes(ext) ? ext : 'json';
      
      const moduleDir = `${translationsDir}/${project.name}`;
      
      // Créer le dossier du module s'il n'existe pas
      if (!fs.existsSync(moduleDir)) {
        fs.mkdirSync(moduleDir, { recursive: true });
      }

      const enPath = `${moduleDir}/en.${validExt}`;
      const frPath = `${moduleDir}/fr.json`; // Toujours utiliser JSON pour les traductions

      // Télécharger le fichier source anglais
      try {
        await download(project.src, enPath);
        console.log(`✅ Fichier anglais téléchargé: ${enPath}`);
        
        // Convertir YAML en JSON si nécessaire
        if (validExt === 'yml' || validExt === 'yaml') {
          const yamlContent = fs.readFileSync(enPath, 'utf8');
          const jsonContent = yamlParser.load(yamlContent);
          fs.writeFileSync(`${moduleDir}/en.json`, JSON.stringify(jsonContent, null, 2));
          console.log(`✅ Converti YAML en JSON: ${moduleDir}/en.json`);
        }
      } catch (error) {
        console.error(`❌ Échec du téléchargement pour ${project.name}: ${error.message}`);
        continue;
      }

      // Créer fichier français vide si inexistant
      if (!fs.existsSync(frPath)) {
        writeEmptyFile(frPath, 'json');
        console.log(`✅ Fichier français créé: ${frPath}`);
      }
    }

    console.log('Mise à jour des sources de langue terminée.');
  } catch (error) {
    console.error('Erreur globale:', error);
    process.exit(1);
  }
}

main();