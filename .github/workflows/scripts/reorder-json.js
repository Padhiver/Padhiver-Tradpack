const fs = require('fs');
const path = require('path');

// Fonction pour réorganiser les traductions selon l'ordre des clés du fichier original
function reorderTranslations(original, translated) {
    const ordered = {};
    
    // Gestion des clés originales
    Object.keys(original).forEach(key => {
        // Vérifie si la clé est un objet et nécessite un traitement récursif
        if (typeof original[key] === 'object' && original[key] !== null && !Array.isArray(original[key]) && 
            typeof translated[key] === 'object' && translated[key] !== null && !Array.isArray(translated[key])) {
            ordered[key] = reorderTranslations(original[key], translated[key]);
        } 
        // Sinon, traite comme une simple clé-valeur
        else if (translated[key] !== undefined) {
            ordered[key] = translated[key];
        } else {
            // Garde la valeur originale si non traduite
            ordered[key] = original[key];
        }
    });
    
    // Ajoute les clés traduites qui n'existent pas dans le fichier original
    Object.keys(translated).forEach(key => {
        if (ordered[key] === undefined) {
            ordered[key] = translated[key];
        }
    });
    
    return ordered;
}

// Fonction pour détecter si un fichier JSON utilise des tabulations
function usesTabIndentation(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        // Vérifier si le premier caractère d'indentation est une tabulation
        return content.includes('\n\t');
    } catch (error) {
        return false;
    }
}

// Fonction principale pour traiter un module
function processModule(moduleDir) {
    const enPath = path.join(moduleDir, 'en.json');
    const frPath = path.join(moduleDir, 'fr.json');
    
    if (!fs.existsSync(enPath) || !fs.existsSync(frPath)) {
        console.log(`Fichiers manquants pour ${moduleDir}, ignoré.`);
        return;
    }

    try {
        const original = JSON.parse(fs.readFileSync(enPath, 'utf8'));
        const translated = JSON.parse(fs.readFileSync(frPath, 'utf8'));

        const ordered = reorderTranslations(original, translated);
        
        // Déterminer le type d'indentation à utiliser (tabulations ou espaces)
        const usesTabs = usesTabIndentation(enPath);
        
        if (usesTabs) {
            // Utiliser des tabulations pour l'indentation
            fs.writeFileSync(frPath, JSON.stringify(ordered, null, '\t'));
        } else {
            // Utiliser des espaces pour l'indentation (par défaut: 2 espaces)
            fs.writeFileSync(frPath, JSON.stringify(ordered, null, 2));
        }
        
        console.log(`✅ Réorganisé: ${frPath} (indentation avec ${usesTabs ? 'tabulations' : 'espaces'})`);
    } catch (error) {
        console.error(`❌ Erreur lors du traitement de ${moduleDir}:`, error.message);
    }
}

// Traite tous les modules
const translationsDir = './translations';

if (!fs.existsSync(translationsDir)) {
    console.error(`Le répertoire ${translationsDir} n'existe pas.`);
    process.exit(1);
}

const modules = fs.readdirSync(translationsDir)
    .filter(dir => fs.statSync(path.join(translationsDir, dir)).isDirectory());

if (modules.length === 0) {
    console.log("Aucun module trouvé dans le répertoire des traductions.");
} else {
    console.log(`Traitement de ${modules.length} modules...`);
    modules.forEach(dir => processModule(path.join(translationsDir, dir)));
    console.log("Réorganisation terminée.");
}