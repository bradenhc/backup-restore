const meta = require('./meta');
const config = require('./config');
const asyncro = require('async');
const archiver = require('archiver');
const fs = require('fs');
const util = require('util');
const path = require('path');
const Block = require('./block');

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

class BackupEngine {
    constructor(name, encrypt, files) {
        this.metadata = meta.create(name, encrypt);
        this.files = files;
        this.directories = new Set();
        this.destination = config.get('current');
        this.blocks = [new Block()];
    }

    start() {
        console.log(`Backing up ${this.files.length} directories`);
        asyncro.each(this.files, this._stat.bind(this), err => {
            if (err) throw err;
        });
    }

    async _stat(file) {
        try {
            let stats = await stat(file);
            if (stats.isDirectory()) {
                // We are dealing with a directory, open up the contents and get information about each of the files
                // so that we know the entire size
                this.directories.add(file);
                let files = await readdir(file);
                files = files.map(f => path.join(file, f));
                asyncro.each(files, this._stat.bind(this), err => {
                    if (err) throw err;
                    this.directories.delete(file);
                    if (this.directories.size == 0) {
                        this._compressBlock(this.blocks[this.blocks.length - 1]);
                    }
                    return true;
                });
            } else {
                // Accumulate stats for meta data
                this.metadata.size += stats.size;
                let hasRoom = this.blocks[this.blocks.length - 1].add(file, stats.size);
                if (!hasRoom) {
                    this._compressBlock(this.blocks[this.blocks.length - 1]);
                    this.blocks.push(new Block());
                    this.blocks[this.blocks.length - 1].add(file, stats.size);
                }
            }
        } catch (e) {
            throw e;
        }
    }

    _compressBlock(block) {
        const archive = archiver('zip');
        block.buffer.on('end', () => {
            console.log('Compressed block size (bytes):', archive.pointer());
            this._saveBlock(block);
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

    _saveBlock(block) {
        // Write to destination
        console.log('Block zipped. Saving');
        fs.writeFile(process.cwd() + `/${block.id}.zip`, block.buffer.data, err => {
            if (err) console.log(err);
        });
    }
}

async function run(name, encrypt, files) {
    let backup = new BackupEngine(name, encrypt, files);
    backup.start();
}

module.exports = {
    run
};
