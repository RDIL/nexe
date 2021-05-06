"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_1 = require("fs");
const util_1 = require("../util");
const mkdirp = require("mkdirp");
/**
 * The "cli" step detects the appropriate input. If no input options are passed,
 * the package.json#main file is used.
 * After all the build steps have run, the output (the executable) is written to a file or piped to stdout.
 *
 * Configuration:
 *
 * @param {*} compiler
 * @param {*} next
 */
async function cli(compiler, next) {
    await next();
    const { log } = compiler, target = compiler.options.targets.shift(), deliverable = await compiler.compileAsync(target), output = path_1.normalize(compiler.output);
    mkdirp.sync(path_1.dirname(output));
    return new Promise((res, rej) => {
        const step = log.step('Writing result to file');
        deliverable
            .pipe(fs_1.createWriteStream(output))
            .on('error', rej)
            .once('close', (e) => {
            if (e) {
                rej(e);
            }
            else if (compiler.output) {
                const output = compiler.output, mode = fs_1.statSync(output).mode | 0o111, inputFileLogOutput = path_1.relative(process.cwd(), path_1.resolve(compiler.options.cwd, compiler.entrypoint || compiler.options.input)), outputFileLogOutput = path_1.relative(process.cwd(), output);
                fs_1.chmodSync(output, mode.toString(8).slice(-3));
                step.log(`Entry: '${compiler.stdinUsed
                    ? compiler.options.mangle
                        ? util_1.STDIN_FLAG
                        : '[none]'
                    : inputFileLogOutput}' written to: ${outputFileLogOutput}`);
                compiler.quit();
                res(output);
            }
        });
    });
}
exports.default = cli;
