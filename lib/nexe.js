"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NexeCompiler = exports.compile = void 0;
const app_builder_1 = require("app-builder");
const compiler_1 = require("./compiler");
Object.defineProperty(exports, "NexeCompiler", { enumerable: true, get: function () { return compiler_1.NexeCompiler; } });
const options_1 = require("./options");
const resource_1 = require("./steps/resource");
const clean_1 = require("./steps/clean");
const cli_1 = require("./steps/cli");
const bundle_1 = require("./steps/bundle");
const download_1 = require("./steps/download");
const shim_1 = require("./steps/shim");
const artifacts_1 = require("./steps/artifacts");
const patches_1 = require("./patches");
async function compile(compilerOptions, callback) {
    let error = null, options = null, compiler = null;
    try {
        options = options_1.normalizeOptions(compilerOptions);
        compiler = new compiler_1.NexeCompiler(options);
        await app_builder_1.compose(clean_1.default, resource_1.default, cli_1.default, bundle_1.default, shim_1.default, download_1.default, options.build ? [artifacts_1.default, ...patches_1.default, ...options.patches] : [], options.plugins)(compiler);
    }
    catch (e) {
        error = e;
    }
    if (error) {
        compiler && compiler.quit(error);
        if (callback)
            return callback(error);
        return Promise.reject(error);
    }
    if (callback)
        callback(null);
}
exports.compile = compile;
var options_2 = require("./options");
Object.defineProperty(exports, "argv", { enumerable: true, get: function () { return options_2.argv; } });
Object.defineProperty(exports, "version", { enumerable: true, get: function () { return options_2.version; } });
Object.defineProperty(exports, "help", { enumerable: true, get: function () { return options_2.help; } });
