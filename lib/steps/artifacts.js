"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs = require("fs");
const util_1 = require("util");
const util_2 = require("../util");
const mkdirpAsync = require("mkdirp");
const unlinkAsync = util_1.promisify(fs.unlink), readdirAsync = util_1.promisify(fs.readdir);
function readDirAsync(dir) {
    return readdirAsync(dir).then((paths) => {
        return Promise.all(paths.map((file) => {
            const path = path_1.join(dir, file);
            return util_2.isDirectoryAsync(path).then((x) => (x ? readDirAsync(path) : path));
        })).then((result) => {
            return [].concat(...result);
        });
    });
}
function maybeReadFileContentsAsync(file) {
    return util_2.readFileAsync(file, 'utf-8').catch((e) => {
        if (e.code === 'ENOENT') {
            return '';
        }
        throw e;
    });
}
/**
 * The artifacts step is where source patches are committed, or written as "artifacts"
 * Steps:
 *  - A temporary directory is created in the downloaded source
 *  - On start, any files in that directory are restored into the source tree
 *  - After the patch functions have run, the temporary directory is emptied
 *  - Original versions of sources to be patched are written to the temporary directory
 *  - Finally, The patched files are written into source.
 */
async function artifacts(compiler, next) {
    const { src } = compiler;
    const temp = path_1.join(src, 'nexe');
    await mkdirpAsync(temp);
    const tmpFiles = await readDirAsync(temp);
    await Promise.all(tmpFiles.map(async (path) => {
        return compiler.writeFileAsync(path.replace(temp, ''), await util_2.readFileAsync(path, 'utf-8'));
    }));
    await next();
    await Promise.all(tmpFiles.map((x) => unlinkAsync(x)));
    return Promise.all(compiler.files.map(async (file) => {
        const sourceFile = path_1.join(src, file.filename);
        const tempFile = path_1.join(temp, file.filename);
        const fileContents = await maybeReadFileContentsAsync(sourceFile);
        await mkdirpAsync(path_1.dirname(tempFile));
        await util_2.writeFileAsync(tempFile, fileContents);
        await compiler.writeFileAsync(file.filename, file.contents);
    }));
}
exports.default = artifacts;
