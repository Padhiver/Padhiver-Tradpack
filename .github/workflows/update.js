const request = require('request');
const fs = require('fs');

const download = (url, dest, cb) => {
    const file = fs.createWriteStream(dest);
    const sendReq = request.get(url);

    // Vérification du code de réponse
    sendReq.on('response', (response) => {
        if (response.statusCode !== 200) {
            return cb('Response status was ' + response.statusCode);
        }

        sendReq.pipe(file);
    });

    file.on('finish', () => file.close(cb));

    sendReq.on('error', (err) => {
        fs.unlink(dest);
        return cb(err.message);
    });

    file.on('error', (err) => {
        fs.unlink(dest);
        return cb(err.message);
    });
};

const projects = JSON.parse(fs.readFileSync('./projects.json', 'utf8'));
for (let project of projects) {
    const ext = project.yml ? "yml" : "json";
    
    // Télécharger le fichier source anglais
    download(project.src, `./english/${project.name}.${ext}`, () => {});
    
    // Créer un fichier de traduction français vide s'il n'existe pas
    if (!fs.existsSync(`./french/${project.name}.${ext}`))
        fs.writeFileSync(`./french/${project.name}.${ext}`, '{}');
}