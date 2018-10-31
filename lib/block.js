const config = require('./config');
const uuid = require('uuid/v4');
const MemBuffer = require('./mem-buffer');

const DEFAULT_MAX_BLOCK_SIZE = 2000000;

module.exports = class Block {
    constructor() {
        this.id = uuid();
        this.size = 0;
        this.files = [];
        this.max = config.get('maxBlockSize') || DEFAULT_MAX_BLOCK_SIZE;
        this.buffer = new MemBuffer();
    }

    add(file, size) {
        if (this.size + size > this.max) return false;
        this.files.push(file);
        this.size += size;
        return true;
    }
}
