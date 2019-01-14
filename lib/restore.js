/**
 * How this works:
 * 1) Look for a backup with the provided name
 * 2) Read the metadata file to determine how to proceed with the recovery
 * 3) Look inside the backup directory for all the .br files
 * 4) As needed, decrypt the zipped files before unzipping
 * 5) Begin unzipping all the backup files into the current working directory
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const util = require('util');
const stream = require('stream');
const crypt = require('./crypt');

const config = require('./config');

const readfile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);

let metadata;
let source;
let destination;

async function init(name, dest) {
    try {
        await config.load();
        source = path.join(config.get('destination.current'), name);
        metadata = JSON.parse(await readfile(`${source}/meta.json`));
        if (!dest) {
            dest = process.cwd();
        }
        destination = dest;
    } catch (err) {
        console.log(err);
    }
}

async function start() {
    // Read all .br files from the destination
    try {
        let items = await readdir(source);
        for (let file of items) {
            if (path.extname(file) === '.br') {
                unpack(await readfile(path.join(source, file)));
            }
        }
    } catch(err) {
        console.log(err);
    }
    
}

async function unpack(buffer) {
    if (metadata.encrypted) {
        if (!process.env.BR_PASS) {
            throw new Error('Backup files are encrypted but no password has been provided');
        }
        buffer = crypt.decrypt(buffer, process.env.BR_PASS);
    }
    let fstream = new stream.PassThrough();
    fstream.end(buffer);
    let unzip = zlib.createGunzip();
    let ostream = fs.createWriteStream(`${destination}/out`);
    fstream.pipe(unzip).pipe(ostream).on('entry', (entry) => {
        console.log(entry);
    });
}

async function list() {
    await config.load();
    let dest = config.get('destination.current');
    return await readdir(dest);
}

module.exports = {
    init,
    start,
    list
};
