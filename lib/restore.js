/**
 * How this works:
 * 1) Look for a backup with the provided name
 * 2) Read the metadata file to determine how to proceed with the recovery
 * 3) Look inside the backup directory for all the .br files
 * 4) As needed, decrypt the zipped files before unzipping
 * 5) Begin unzipping all the backup files into the current working directory
 */
const fs = require('fs');
const archiver = require('archiver');
const asyncro = require('async');
const util = require('util');

const config = require('./config');

function start(name){
    
}