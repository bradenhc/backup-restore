/**
 * How this works:
 * 1) Find all the files and stat them to get their sizes (DFS)
 * 2) Based on sizes, divide up all files into blocks
 * 3) Write the metadata
 * 3) Archive the blocks
 * 4) If encryption is enabled, once the archive has finished, encrypt the file
 * 5) Save the file to the destination
 */

const meta = require('./meta');
const config = require('./config');
const archiver = require('archiver');
const fs = require('fs');
const util = require('util');
const path = require('path');
const Block = require('./block');

const readdir = util.promisify(fs.readdir);
const lstat = util.promisify(fs.lstat);
const mkdir = util.promisify(fs.mkdir);
const writefile = util.promisify(fs.writeFile);
const direxists = util.promisify(fs.exists);

let metadata = null;
let destination = null;

async function init(name, encrypt) {
    try {
        await config.load();
        destination = path.join(config.get('destination.current'), name);
        blocks = [new Block()];
        metadata = meta.create(name, encrypt);
        console.log('Backup Initialized');
        console.log('    Destination:', destination);
    } catch (err) {
        console.log(err);
    }
}

async function gather(dir) {
    let results = [];
    try {
        let items = await readdir(dir);
        let pending = items.length;
        if (!pending) return results;
        for (let file of items) {
            file = path.join(dir, file);
            let stat = await lstat(file);
            if (stat.isDirectory()) {
                let res = await gather(file);
                results = results.concat(res);
                if (!--pending) return results;
            } else {
                results.push({ name: file, size: stat.size });
                if (!--pending) return results;
            }
        }
    } catch (err) {
        console.log(err);
    }
}

async function compress(files) {
    let blocks = [new Block()];
    for (let file of files) {
        let success = blocks[blocks.length - 1].add(file.name, file.size);
        if (!success) {
            // Block is full, compress
            let block = blocks[blocks.length - 1];
            archive(block);
            blocks.push(new Block());
            blocks[blocks.length - 1].add(file.name, file.size);
        }
    }
    archive(blocks[blocks.length - 1]);
}

function archive(block){
    let archive = archiver('zip');
    block.buffer.on('end', () => {
        console.log('Compressed block size (bytes):', archive.pointer());
        save(block);
    });
    archive.on('warning', err => {
        if (err.code === 'ENOENT') {
            console.log('W: ', err);
        } else {
            console.log(err);
            throw err;
        }
    });
    archive.on('error', err => {
        console.log(err);
        throw err;
    });
    archive.pipe(block.buffer);
    for (let file of block.files) {
        archive.file(file);
    }
    archive.finalize();
}

async function save(block) {
    // Write to destination
    console.log('Block zipped. Saving');
    try {
        let exists = await direxists(destination);
        if (!exists) {
            await mkdir(destination);
        }
        await writefile(`${destination}/${block.id}.br`, block.buffer.data);
        await writefile(`${destination}/meta.json`, JSON.stringify(metadata));
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    gather,
    compress,
    save,
    init
};
