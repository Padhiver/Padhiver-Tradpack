const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Fonction pour télécharger et préserver exactement le formatage original
const downloadWithExactFormatting = async (url, dest) => {
    console.log(`Téléchargement avec préservation exacte du formatage: ${url} → ${dest}`);
    try {
        // Création du répertoire si nécessaire
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        
        // Téléchargement du fichier comme texte brut pour préserver le formatage exact
        const response = await axios({
            method: 'get',
            url,
            responseType: 'text',
            timeout: 15000 // Augmenter le timeout pour les fichiers plus volumineux
        });
        
        if (response.status !== 200) throw new Error(`Statut HTTP: ${response.status}`);
        
        // Vérifier que c'est un JSON valide
        try {
            JSON.parse(response.data); // Vérification seulement, ne modifie pas le formatage
            
            // Écrire exactement le contenu reçu, sans reformatage
            fs.writeFileSync(dest, response.data);
            
            return response.data;
        } catch (e) {
            console.error(`Contenu JSON invalide pour ${url}: ${e.message}`);
            throw e;
        }
    } catch (err) {
        console.error(`Erreur de téléchargement pour ${url}: ${err.message}`);
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
        console.log(`Traitement de ${projects.length} projets...`);
        
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
                
                // Toujours télécharger et mettre à jour le fichier anglais
                const content = await downloadWithExactFormatting(project.src, enFile);
                console.log(`✅ Fichier anglais mis à jour: ${enFile} (${content.length} caractères)`);
                
                // Création du fichier français vide s'il n'existe pas
                if (!fs.existsSync(frFile)) {
                    console.log(`Création du fichier fr.json pour ${project.name}`);
                    fs.writeFileSync(frFile, '{}');
                    console.log(`✅ Fichier français créé: ${frFile}`);
                }
            } catch (err) {
                console.error(`Échec du traitement pour ${project.name}:`, err.message);
            }
        }
        
        // Liste des fichiers créés pour vérification
        console.log("\nContenu du répertoire translations:");
        if (fs.existsSync('translations')) {
            const dirs = fs.readdirSync('translations');
            console.log(`${dirs.length} projets traités:`);
            
            for (const dir of dirs) {
                try {
                    const files = fs.readdirSync(`translations/${dir}`);
                    console.log(`- ${dir}: ${files.join(', ')}`);
                } catch (err) {
                    console.error(`Erreur de lecture du dossier ${dir}: ${err.message}`);
                }
            }
        }
        
        console.log("Traitement terminé avec succès");
    } catch (error) {
        console.error('Erreur globale:', error);
        process.exit(1);
    }
})();