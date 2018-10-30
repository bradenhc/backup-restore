const backup = require('./lib/backup');
const config = require('./lib/config');

process.env.BR_CONFIG = __dirname;

(async function() {
    try{
        await config.load();

        let files = ['config.json', 'lib', 'node_modules'];

        backup.run('', false, files);
    } catch(err){
        console.log(err);
    }
    
})();
