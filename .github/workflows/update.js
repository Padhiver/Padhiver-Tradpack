const axios = require('axios');
const fs = require('fs');
const path = require('path');

const download = async (url, dest) => {
    try {
        // Créer le répertoire parent si nécessaire
        fs.mkdirSync(path.dirname(dest), { recursive: true });

        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream'
        });

        if (response.status !== 200) {
            throw new Error(`Response status was ${response.status}`);
        }

        const writer = fs.createWriteStream(dest);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', (err) => {
                fs.unlink(dest, () => {});
                reject(err);
            });
        });
    } catch (err) {
        if (fs.existsSync(dest)) {
            fs.unlinkSync(dest);
        }
        throw err;
    }
};

const projects = JSON.parse(fs.readFileSync('./projects.json', 'utf8'));

(async () => {
    for (let project of projects) {
        try {
            const moduleDir = `translations/${project.name}`;
            
            // Télécharger le fichier source anglais
            await download(project.src, `${moduleDir}/en.json`);
            
            // Créer le fichier français vide s'il n'existe pas
            const frenchFile = `${moduleDir}/fr.json`;
            if (!fs.existsSync(frenchFile)) {
                fs.mkdirSync(moduleDir, { recursive: true });
                fs.writeFileSync(frenchFile, '{}');
            }
        } catch (err) {
            console.error(`Error processing ${project.name}:`, err.message);
        }
    }
})();