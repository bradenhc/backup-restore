const backup = require('../lib/backup');
const restore = require('../lib/restore');
const program = require('commander');

program.version('1.0.0', '-v, --version').description('Backup and restore files');

program
    .command('backup <dirs...>')
    .description('Backup the provided directories')
    .option('-n, --name <name>', 'name of the backup', 'br-backup-' + new Date().toDateString().replace(/\s/g, '-'))
    .option('-e, --encrypt', 'whether or not to encrypt the backup files', false)
    .action(_backup);

program
    .command('restore <name> [<destination>]')
    .description('Restore the files previously backed up under the provided name to the given destination')
    .action(_restore);

program
    .command('list')
    .description('List the available backups under the currently configured destination')
    .action(_list);

program.parse(process.argv);

async function _backup(dirs, options) {
    try {
        await backup.init(options.name, options.encrypt);
        let files = [];
        for (let dir of dirs) {
            files = files.concat(await backup.gather(dir));
            console.log(files.length);
        }
        await backup.compress(files);
    } catch (err) {
        console.log(err);
    }
}

async function _restore(name, destination) {
    try {
        await restore.init(name, destination);
        await restore.start();
    } catch (err) {
        console.log(err);
    }
}

async function _list() {
    try {
        let files = await restore.list();
        console.log('');
        for(let f of files) {
            console.log('    ' + f);
        }
        console.log('');
    } catch(err) {
        console.log(err);
    }
}
