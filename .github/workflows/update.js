const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Créer le répertoire translations s'il n'existe pas
const translationsDir = './translations';
if (!fs.existsSync(translationsDir)) {
  fs.mkdirSync(translationsDir, { recursive: true });
}

async function download(url, dest) {
  const response = await axios({
    method: 'get',
    url: url,
    responseType: 'stream'
  });

  const writer = fs.createWriteStream(dest);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function main() {
  try {
    const projects = JSON.parse(fs.readFileSync('./projects.json', 'utf8'));
    const projectsArray = Array.isArray(projects) ? projects : [projects];

    for (const project of projectsArray) {
      const ext = project.src.endsWith('.yml') ? 'yml' : 'json';
      const moduleDir = `${translationsDir}/${project.name}`;
      
      // Créer le dossier du module s'il n'existe pas
      if (!fs.existsSync(moduleDir)) {
        fs.mkdirSync(moduleDir, { recursive: true });
      }

      const enPath = `${moduleDir}/en.${ext}`;
      const frPath = `${moduleDir}/fr.${ext}`;

      // Télécharger le fichier source anglais
      await download(project.src, enPath);
      console.log(`Fichier anglais téléchargé: ${enPath}`);

      // Créer fichier français vide si inexistant
      if (!fs.existsSync(frPath)) {
        fs.writeFileSync(frPath, '{}');
        console.log(`Fichier français créé: ${frPath}`);
      }
    }
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

main();