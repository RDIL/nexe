"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
const globs = require("globby");
const path_1 = require("path");
async function resource(compiler, next) {
    const { cwd, resources } = compiler.options;
    if (!resources.length) {
        return next();
    }
    const step = compiler.log.step('Bundling Resources...');
    let count = 0;
    // workaround for https://github.com/sindresorhus/globby/issues/127
    // and https://github.com/mrmlnc/fast-glob#pattern-syntax
    const resourcesWithForwardSlashes = resources.map((r) => r.replace(/\\/g, '/'));
    await util_1.each(globs(resourcesWithForwardSlashes, { cwd, onlyFiles: true }), async (file) => {
        count++;
        step.log(`Including file: ${file}`);
        await compiler.addResource(path_1.resolve(cwd, file));
    });
    step.log(`Included ${count} file(s)`);
    return next();
}
exports.default = resource;
