const backup = require('../lib/backup');
const program = require('commander');

program
    .version('1.0.0', '-v, --version')
    .description('Backup and restore files');

program
    .command('backup <dirs...>')
    .description('Backup the provided directories')
    .option('-n, --name <name>', 'name of the backup', 'br-backup-' + new Date().toDateString().replace(/\s/g, '-'))
    .option('-e, --encrypt', 'whether or not to encrypt the backup files', false)
    .action(_backup);

program.parse(process.argv);

async function _backup(dirs, options){
    try {
        await backup.init(options.name, options.encrypt);
        let files = [];
        for(let dir of dirs){
            files = files.concat(await backup.gather(dir));
            console.log(files.length);
        }
        await backup.compress(files);
    } catch(err){
        console.log(err);
    }
}
