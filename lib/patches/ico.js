"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const util_1 = require("../util");
async function ico(compiler, next) {
    const iconFile = compiler.options.ico;
    if (!iconFile) {
        return next();
    }
    await compiler.setFileContentsAsync('src/res/node.ico', await util_1.readFileAsync(path_1.normalize(iconFile)));
    return next();
}
exports.default = ico;
