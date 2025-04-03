const axios = require('axios');
const fs = require('fs');

// Créer le répertoire translations s'il n'existe pas
const translationsDir = './translations';
if (!fs.existsSync(translationsDir)) {
  fs.mkdirSync(translationsDir, { recursive: true });
}

// Télécharger le contenu d'un fichier JSON
async function downloadJsonContent(url) {
  try {
    console.log(`Téléchargement depuis: ${url}`);
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'text',
      timeout: 10000
    });
    
    // Vérifier que le contenu est un JSON valide
    try {
      JSON.parse(response.data); // Validation
      return response.data;
    } catch (e) {
      console.error(`Contenu JSON invalide: ${e.message}`);
      throw e;
    }
  } catch (error) {
    console.error(`Erreur lors du téléchargement: ${error.message}`);
    throw error;
  }
}

// Fonction principale
async function main() {
  try {
    // Vérifier que le fichier projects.json existe
    if (!fs.existsSync('./projects.json')) {
      console.error('Fichier projects.json introuvable');
      process.exit(1);
    }

    // Charger et analyser le fichier projects.json
    let projectsData;
    try {
      const projectsContent = fs.readFileSync('./projects.json', 'utf8');
      projectsData = JSON.parse(projectsContent);
      console.log(`Contenu chargé de projects.json: ${projectsContent.substring(0, 100)}...`);
    } catch (error) {
      console.error(`Erreur lors du chargement de projects.json: ${error.message}`);
      process.exit(1);
    }

    // S'assurer que projectsData est un tableau
    const projects = Array.isArray(projectsData) ? projectsData : [projectsData];
    console.log(`Traitement de ${projects.length} projets...`);

    // Traiter chaque projet
    for (const project of projects) {
      // Vérifier que le projet a les propriétés nécessaires
      if (!project.src || !project.name) {
        console.warn('Projet invalide, ignoré:', project);
        continue;
      }

      // Créer le dossier du module
      const moduleDir = `${translationsDir}/${project.name}`;
      console.log(`Création du dossier: ${moduleDir}`);
      
      if (!fs.existsSync(moduleDir)) {
        fs.mkdirSync(moduleDir, { recursive: true });
      }

      // Chemins des fichiers
      const enPath = `${moduleDir}/en.json`;
      const frPath = `${moduleDir}/fr.json`;

      try {
        // Télécharger le fichier anglais
        const content = await downloadJsonContent(project.src);
        
        // Écrire le fichier anglais
        fs.writeFileSync(enPath, content);
        console.log(`✅ Fichier anglais écrit: ${enPath}`);
        
        // Vérifier que le fichier existe réellement
        if (fs.existsSync(enPath)) {
          const stats = fs.statSync(enPath);
          console.log(`   Taille du fichier: ${stats.size} octets`);
        } else {
          console.error(`❌ Le fichier ${enPath} n'existe pas après l'écriture!`);
        }

        // Créer fichier français vide s'il n'existe pas
        if (!fs.existsSync(frPath)) {
          fs.writeFileSync(frPath, '{}');
          console.log(`✅ Fichier français créé: ${frPath}`);
        }
      } catch (error) {
        console.error(`❌ Échec pour ${project.name}: ${error.message}`);
      }
    }

    // Vérifier le contenu du répertoire translations après traitement
    console.log("\nContenu du répertoire translations après traitement:");
    if (fs.existsSync(translationsDir)) {
      const dirs = fs.readdirSync(translationsDir);
      console.log(`Dossiers créés: ${dirs.join(', ')}`);
      
      for (const dir of dirs) {
        const files = fs.readdirSync(`${translationsDir}/${dir}`);
        console.log(`- ${dir}: ${files.join(', ')}`);
      }
    } else {
      console.error("❌ Le répertoire translations n'existe pas après traitement!");
    }

    console.log('Mise à jour des sources de langue terminée.');
  } catch (error) {
    console.error('Erreur globale:', error);
    process.exit(1);
  }
}

main();