"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const download = require("download");
const util_1 = require("../util");
const compiler_1 = require("../compiler");
const path_1 = require("path");
function fetchNodeSourceAsync(dest, url, step, options = {}) {
    const setText = (p) => step.modify(`Downloading Node: ${p.toFixed()}%...`);
    return download(url, dest, Object.assign(options, { extract: true, strip: 1 }))
        .on('response', (res) => {
        const total = +res.headers['content-length'];
        let current = 0;
        res.on('data', (data) => {
            current += data.length;
            setText((current / total) * 100);
            if (current === total) {
                step.log('Extracting Node...');
            }
        });
    })
        .then(() => step.log(`Node source extracted to: ${dest}`));
}
async function fetchPrebuiltBinary(compiler, step) {
    const { target, remoteAsset } = compiler, filename = compiler.getNodeExecutableLocation(target);
    try {
        await download(remoteAsset, path_1.dirname(filename), compiler.options.downloadOptions).on('response', (res) => {
            const total = +res.headers['content-length'];
            let current = 0;
            res.on('data', (data) => {
                current += data.length;
                step.modify(`Downloading...${((current / total) * 100).toFixed()}%`);
            });
        });
    }
    catch (e) {
        if (e.statusCode === 404) {
            throw new compiler_1.NexeError(`${remoteAsset} is not available, create it using the --build flag`);
        }
        else {
            throw new compiler_1.NexeError('Error downloading prebuilt binary: ' + e);
        }
    }
}
/**
 * Downloads the node source to the configured temporary directory
 * @param {*} compiler
 * @param {*} next
 */
async function downloadNode(compiler, next) {
    const { src, log, target } = compiler, { version } = target, { sourceUrl, downloadOptions, build } = compiler.options, url = sourceUrl || `https://nodejs.org/dist/v${version}/node-v${version}.tar.gz`, step = log.step(`Downloading ${build ? '' : 'pre-built '}Node.js${build ? `source from: ${url}` : ''}`), exeLocation = compiler.getNodeExecutableLocation(build ? undefined : target), downloadExists = await util_1.pathExistsAsync(build ? src : exeLocation);
    if (downloadExists) {
        step.log('Already downloaded...');
        return next();
    }
    if (build) {
        await fetchNodeSourceAsync(src, url, step, downloadOptions);
    }
    else {
        await fetchPrebuiltBinary(compiler, step);
    }
    return next();
}
exports.default = downloadNode;
