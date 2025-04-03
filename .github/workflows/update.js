const axios = require('axios');
const fs = require('fs');
const path = require('path');

const download = async (url, dest) => {
    console.log(`Téléchargement: ${url} → ${dest}`);
    try {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        const response = await axios({ method: 'get', url, responseType: 'stream' });
        if (response.status !== 200) throw new Error(`Statut: ${response.status}`);
        
        const writer = fs.createWriteStream(dest);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (err) {
        console.error(`Erreur de téléchargement: ${err.message}`);
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        throw err;
    }
};

(async () => {
    const projects = JSON.parse(fs.readFileSync('./projects.json', 'utf8'));
    console.log(`Found ${projects.length} projects to process`);
    
    for (const project of projects) {
        try {
            const moduleDir = `translations/${project.name}`;
            const enFile = `${moduleDir}/en.json`;
            const frFile = `${moduleDir}/fr.json`;
            
            console.log(`Processing ${project.name}...`);
            await download(project.src, enFile);
            
            if (!fs.existsSync(frFile)) {
                console.log(`Creating empty fr.json for ${project.name}`);
                fs.writeFileSync(frFile, '{}');
            }
        } catch (err) {
            console.error(`Failed to process ${project.name}:`, err.message);
        }
    }
    console.log("Traitement terminé");
})();