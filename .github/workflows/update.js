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

// Fonction pour récupérer le contenu brut
async function downloadRawContent(url) {
  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'text',  // Important: forcer le format texte
      timeout: 10000
    });
    
    // Vérifier si la réponse est déjà une chaîne
    if (typeof response.data === 'string') {
      return response.data;
    } 
    // Si c'est un objet, le convertir en JSON formaté
    else if (typeof response.data === 'object') {
      return JSON.stringify(response.data, null, '\t');
    } 
    else {
      throw new Error(`Type de réponse inattendu: ${typeof response.data}`);
    }
  } catch (error) {
    console.error(`Erreur lors du téléchargement du contenu de ${url}: ${error.message}`);
    throw error;
  }
}

// Détecter le type d'indentation d'un fichier JSON
function detectIndentation(content) {
  const lines = content.split('\n');
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('\t')) {
      return '\t'; // Tabulation
    } else if (line.match(/^ {2}/)) {
      return '  '; // Deux espaces
    } else if (line.match(/^ {4}/)) {
      return '    '; // Quatre espaces
    }
  }
  return '\t'; // Par défaut, tabulation
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

      try {
        if (validExt === 'json') {
          // Pour les fichiers JSON, télécharger le contenu brut pour préserver le formatage
          const rawContent = await downloadRawContent(project.src);
          
          // Vérifier que le contenu est un JSON valide
          try {
            JSON.parse(rawContent); // Juste pour valider
            fs.writeFileSync(`${moduleDir}/en.json`, rawContent); // Écrire tel quel pour préserver le formatage
            console.log(`✅ Fichier anglais téléchargé (avec formatage préservé): ${moduleDir}/en.json`);
          } catch (e) {
            console.error(`❌ Contenu JSON invalide pour ${project.name}: ${e.message}`);
            continue;
          }
        } else {
          // Pour les fichiers YAML, télécharger et convertir
          await download(project.src, enPath);
          console.log(`✅ Fichier anglais téléchargé: ${enPath}`);
          
          // Convertir YAML en JSON
          const yamlContent = fs.readFileSync(enPath, 'utf8');
          const jsonContent = yamlParser.load(yamlContent);
          
          // Créer le fichier en.json à côté du fichier YAML
          const enJsonPath = `${moduleDir}/en.json`;
          const jsonString = JSON.stringify(jsonContent, null, '\t'); // Utiliser des tabulations par défaut
          fs.writeFileSync(enJsonPath, jsonString);
          console.log(`✅ Converti YAML en JSON: ${enJsonPath}`);
        }
      } catch (error) {
        console.error(`❌ Échec du téléchargement pour ${project.name}: ${error.message}`);
        continue;
      }

      // Créer fichier français vide si inexistant
      if (!fs.existsSync(frPath)) {
        const enJsonPath = `${moduleDir}/en.json`;
        if (fs.existsSync(enJsonPath)) {
          // Utiliser le même formatage que le fichier anglais
          const enContent = fs.readFileSync(enJsonPath, 'utf8');
          const indentation = detectIndentation(enContent);
          fs.writeFileSync(frPath, '{}');
          console.log(`✅ Fichier français créé: ${frPath}`);
        } else {
          writeEmptyFile(frPath, 'json');
          console.log(`✅ Fichier français créé: ${frPath}`);
        }
      }
    }

    console.log('Mise à jour des sources de langue terminée.');
  } catch (error) {
    console.error('Erreur globale:', error);
    process.exit(1);
  }
}

main();