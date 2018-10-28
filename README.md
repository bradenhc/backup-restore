# backup-restore
Node.js executable for backing up and restoring files

## CLI
```text
> br add <name> <destination>
> br set <name>
> br backup [-n|--name <name>] [-e|--encrypt] <file_or_directory>
> br list
> br restore <name> [<destination>]
```
## Details
Backup/restore will associate meta-data with the backup.
```json
{
    "name": "",
    "date": "",
    "size": 0,
    "compressedSize": 0,
    "blocks": 0,
    "lastRecover": "",
    "encrypted": false
}
```

## Process
1. Gather backup data
2. Chunk out backup (limit block size)
3. ZIP files concurrently (`block.1.zip` `block.2.zip`, ...)
4. Generate metadata (`meta.json`)
5. Push backup to location under named folder
