const { Writable } = require('stream');

module.exports = class MemBuffer extends Writable {
    constructor(options){
        super(options);
        this.data = new Buffer('');
    }

    _write(chunk, encoding, callback){
        this.data = Buffer.concat([this.data, chunk]);
        callback();
    }

    _final(callback){
        this.emit('end');
        callback();
    }
}