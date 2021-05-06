"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const util_1 = require("../util");
async function default_1(compiler, next) {
    const { snapshot, warmup, cwd } = compiler.options;
    if (!snapshot) {
        return next();
    }
    const variablePrefix = util_1.semverGt(compiler.target.version, '11.0.0') ? 'v8_' : '';
    await compiler.replaceInFileAsync(compiler.configureScript, 'def configure_v8(o):', `def configure_v8(o):\n  o['variables']['${variablePrefix}embed_script'] = r'${path_1.resolve(cwd, snapshot)}'\n  o['variables']['${variablePrefix}warmup_script'] = r'${path_1.resolve(cwd, warmup || snapshot)}'`);
    return next();
}
exports.default = default_1;
