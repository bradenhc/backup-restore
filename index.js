const backup = require('./lib/backup');
const config = require('./lib/config');

(async function() {
    try{
        await config.load();

        let files = ['config.json', 'lib', 'node_modules'];

        backup.run('', false, files);
    } catch(err){
        console.log(err);
    }
    
})();
