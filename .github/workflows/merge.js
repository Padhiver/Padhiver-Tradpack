const fs = require('fs');
const merge = require('deepmerge');
const yaml = require('js-yaml');

const entries = fs.readdirSync('./french/').map(file => {
    const filePath = `./french/${file}`;
    if (file.endsWith('.yml')) {
        return yaml.load(fs.readFileSync(filePath, 'utf8'));
    } else if (file.endsWith('.json')) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else return {};
});

const results = merge.all(entries);
fs.writeFileSync(`./fr.json`, JSON.stringify(results));