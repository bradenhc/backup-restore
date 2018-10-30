const meta = require('./meta');
const config = require('./config');
const asyncro = require('async');
const archiver = require('archiver');
const fs = require('fs');
const util = require('util');
const path = require('path');
const EventEmitter = require('events');

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

class BackupEngine extends EventEmitter {
    constructor(name, encrypt, files) {
        super();
        this.metadata = meta.create(name, encrypt);
        this.files = files;
        this.destination = config.get('current');
        this.maxBlockSize = config.get('maxBlockSize');
        this.currentBlockSize = 0;
        this.block = [];
        this.dirnum = 0;
        this.on('file', (file, stats) => {
            // Accumulate stats for meta data
            this.metadata.size += stats.size;
            this.currentBlockSize += stats.size;
            if (this.currentBlockSize > this.maxBlockSize) {
                console.log(this.block);
                this.emit('block', 'hello');
                this.block = [];
                this.currentBlockSize = stat.size;
            }
            this.block.push(file);
        });
        this.on('block', async block => {
            // ZIP, encrypt
            console.log('Archiving block', block);
            let output = fs.createWriteStream( process.cwd() + '/block.zip');
            const archive = archiver('zip');
            output.on('close', function () {
                console.log(archive.pointer() + ' total bytes');
                console.log('archiver has been finalized and the output file descriptor has closed.');
                this.emit('zipped');
            });
            output.on('end', function () {
                console.log('Data has been drained');
            });
            archive.on('warning', function (err) {
                if (err.code === 'ENOENT') {
                    console.log(err);
                } else {
                    console.log(err);
                    throw err;
                }
            });
            archive.on('error', function (err) {
                console.log(err);
                throw err;
            });
            archive.pipe(output);
            block.forEach( file => {
                console.log(file);
                archive.file(file);
            });
            archive.finalize();
        });
        this.on('zipped', buffer => {
            // Write to destination
            console.log('done');
        });
    }

    start() {
        asyncro.each(this.files, this.stat.bind(this), err => {
            if (err) throw err;
        });
    }

    async stat(file) {
        try {
            let stats = await stat(file);
            if (stats.isDirectory()) {
                // We are dealing with a directory, open up the contents and get information about each of the files
                // so that we know the entire size
                this.dirnum++;
                let files = await readdir(file);
                files = files.map(f => path.join(file, f));
                asyncro.each(files, this.stat.bind(this), err => {
                    if (err) throw err;
                    this.dirnum--;
                    if(this.dirnum == 0){
                        this.emit('block', this.block);
                        this.block = [];
                        this.currentBlockSize = 0;
                    }
                    return true;
                });
            } else {
                this.emit('file', file, stats);
            }
        } catch (e) {
            throw e;
        }
    }
}

async function run(name, encrypt, files) {
    let backup = new BackupEngine(name, encrypt, files);
    backup.start();
}

module.exports = {
    run
};
