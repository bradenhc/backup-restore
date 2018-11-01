const backup = require('../lib/backup');
const restore = require('../lib/restore');
const config = require('../lib/config');
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

async function _backup(files, options){
    try {
        await config.load();
        backup.run(options.name, options.encrypt, files);
    } catch(err){
        console.log(err);
    }
}
