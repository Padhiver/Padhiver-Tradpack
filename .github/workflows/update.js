const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Fonction pour télécharger directement en tant que stream vers un fichier
const download = async (url, dest) => {
    console.log(`Téléchargement: ${url} → ${dest}`);
    try {
        // Création du répertoire si nécessaire
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        
        // Téléchargement du fichier
        const response = await axios({
            method: 'get',
            url,
            responseType: 'stream',
            timeout: 10000
        });
        
        if (response.status !== 200) throw new Error(`Statut HTTP: ${response.status}`);
        
        // Écriture directe du stream dans le fichier
        const writer = fs.createWriteStream(dest);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (err) {
        console.error(`Erreur de téléchargement: ${err.message}`);
        // Suppression du fichier en cas d'erreur pour éviter les fichiers partiels
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        throw err;
    }
};

// Fonction pour télécharger comme texte et préserver le formatage
const downloadAsRawText = async (url, dest) => {
    console.log(`Téléchargement avec préservation du formatage: ${url} → ${dest}`);
    try {
        // Création du répertoire si nécessaire
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        
        // Téléchargement du fichier comme texte pour préserver le formatage exact
        const response = await axios({
            method: 'get',
            url,
            responseType: 'text',
            timeout: 10000
        });
        
        if (response.status !== 200) throw new Error(`Statut HTTP: ${response.status}`);
        
        // Vérifier que c'est un JSON valide
        try {
            JSON.parse(response.data);
            fs.writeFileSync(dest, response.data);
            return true;
        } catch (e) {
            console.error(`Contenu JSON invalide: ${e.message}`);
            throw e;
        }
    } catch (err) {
        console.error(`Erreur de téléchargement: ${err.message}`);
        // Suppression du fichier en cas d'erreur
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        throw err;
    }
};

// Fonction principale exécutée immédiatement (IIFE)
(async () => {
    try {
        // Vérification et chargement du fichier projects.json
        if (!fs.existsSync('./projects.json')) {
            console.error('Fichier projects.json introuvable');
            process.exit(1);
        }
        
        const projects = JSON.parse(fs.readFileSync('./projects.json', 'utf8'));
        console.log(`Found ${projects.length} projects to process`);
        
        // Traitement de chaque projet
        for (const project of projects) {
            try {
                if (!project.src || !project.name) {
                    console.warn('Projet invalide, ignoré:', project);
                    continue;
                }
                
                const moduleDir = `translations/${project.name}`;
                const enFile = `${moduleDir}/en.json`;
                const frFile = `${moduleDir}/fr.json`;
                
                console.log(`Processing ${project.name}...`);
                
                // Téléchargement du fichier anglais avec préservation du formatage
                await downloadAsRawText(project.src, enFile);
                
                // Création du fichier français vide s'il n'existe pas
                if (!fs.existsSync(frFile)) {
                    console.log(`Creating empty fr.json for ${project.name}`);
                    fs.writeFileSync(frFile, '{}');
                }
                
                // Vérification que les fichiers ont bien été créés
                if (fs.existsSync(enFile)) {
                    const stats = fs.statSync(enFile);
                    console.log(`✅ Fichier anglais créé: ${enFile} (${stats.size} octets)`);
                }
                
                if (fs.existsSync(frFile)) {
                    const stats = fs.statSync(frFile);
                    console.log(`✅ Fichier français: ${frFile} (${stats.size} octets)`);
                }
            } catch (err) {
                console.error(`Failed to process ${project.name}:`, err.message);
            }
        }
        
        console.log("Traitement terminé");
        
        // Liste des fichiers créés pour vérification
        console.log("\nContenu du répertoire translations:");
        if (fs.existsSync('translations')) {
            const dirs = fs.readdirSync('translations');
            for (const dir of dirs) {
                const files = fs.readdirSync(`translations/${dir}`);
                console.log(`- ${dir}: ${files.join(', ')}`);
            }
        }
    } catch (error) {
        console.error('Erreur globale:', error);
        process.exit(1);
    }
})();