"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
async function clean(compiler, next) {
    const { options } = compiler;
    if (options.clean) {
        let path = compiler.src;
        if (!options.build) {
            path = compiler.getNodeExecutableLocation(compiler.options.targets[0]);
        }
        const step = compiler.log.step('Cleaning up nexe build artifacts...');
        step.log(`Deleting contents at: ${path}`);
        await util_1.rimrafAsync(path);
        step.log(`Deleted contents at: ${path}`);
        return compiler.quit();
    }
    return next();
}
exports.default = clean;
