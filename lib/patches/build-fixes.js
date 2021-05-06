"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function buildFixes(compiler, next) {
    if (!compiler.target.version.startsWith('8.2')) {
        return next();
    }
    const file = await compiler.readFileAsync('./tools/msvs/find_python.cmd');
    await compiler.replaceInFileAsync('./tools/msvs/find_python.cmd', '%p%python.exe -V 2>&1', '"%p%python.exe" -V 2>&1');
    return next();
}
exports.default = buildFixes;
