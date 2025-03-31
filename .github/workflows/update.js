const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Créer les répertoires s'ils n'existent pas
['./english', './french'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

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
      const engPath = `./english/${project.name}.${ext}`;
      const frPath = `./french/${project.name}.${ext}`;

      // Télécharger le fichier source
      await download(project.src, engPath);
      console.log(`Fichier anglais téléchargé: ${engPath}`);

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