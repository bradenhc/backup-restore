const fs = require('fs');
const path = require('path');
let config = null;
let configDir = process.env.BR_CONFIG || process.env.HOME + '/.backup-restore';

async function load() {
    // Can only load once
    if (config != null) return true;
    let configFile = path.join(configDir, 'config.json');
    try {
        config = await new Promise((resolve, reject) => {
            fs.readFile(configFile, 'utf8', (err, text) => {
                if (err) return reject(err);
                return resolve(JSON.parse(text));
            });
        });
        return true;
    } catch (e) {
        throw e;
    }
}

function get(key) {
    // We could have a nested value (object in object) denoted by a period delimited string key
    let keys = key.split('.');
    let value = config;
    try {
        for (const k of keys) {
            value = value[k];
        }
        return value;
    } catch (e) {
        console.log(e);
    }
    return null;
}

function set(key, value) {
    // We could have a nested value (object in object) denoted by a period delimited string key
    let keys = key.split('.');
    let obj = config;
    try {
        for (const k of keys) {
            obj = obj[k];
        }
        obj = value;
        return true;
    } catch (e) {
        return false;
    }
}

async function save() {
    let configFile = path.join(configDir, 'config.json');
    try {
        let oldConfig = await new Promise((resolve, reject) => {
            fs.readFile(configFile, 'utf8', (err, text) => {
                if (err) return reject(err);
                return resolve(JSON.parse(text));
            });
        });
        let newConfig = { ...oldConfig, ...config };
        await new Promise((resolve, reject) => {
            fs.writeFile(configFile, JSON.stringify(newConfig), 'utf8', err => {
                if (err) return reject(err);
                return resolve();
            });
        });
        return true;
    } catch (e) {
        throw e;
    }
}

module.exports = {
    load,
    get,
    set,
    save
};
