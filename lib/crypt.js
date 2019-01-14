const crypto = require('crypto');

let algo = 'aes256';

function encrypt(buffer, password) {
    let key = crypto
        .createHash('sha256')
        .update(password)
        .digest();
    let iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv(algo, key, iv);
    return Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
}

function decrypt(buffer, password) {
    let key = crypto
        .createHash('sha256')
        .update(password)
        .digest();
    let iv = buffer.slice(0, 16);
    buffer = buffer.slice(16);
    decipher = crypto.createDecipheriv(algo, key, iv);
    return Buffer.concat([decipher.update(buffer), decipher.final()]);
}

module.exports = {
    encrypt,
    decrypt
};
