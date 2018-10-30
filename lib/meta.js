function create(name, encrypt) {
    return {
        name: name || '',
        date: new Date().toDateString(),
        size: 0,
        compressedSize: 0,
        blocks: 0,
        lastRecover: '',
        encrypted: encrypt || false
    };
}

module.exports = {
    create
};
