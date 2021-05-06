"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cherow_1 = require("cherow");
const util_1 = require("../util");
function walkSome(node, visit) {
    if (!node || typeof node.type !== 'string' || node._visited) {
        return false;
    }
    visit(node);
    node._visited = true;
    for (let childNode in node) {
        const child = node[childNode];
        if (Array.isArray(child)) {
            for (let i = 0; i < child.length; i++) {
                if (walkSome(child[i], visit)) {
                    return true;
                }
            }
        }
        else if (walkSome(child, visit)) {
            return true;
        }
    }
    return false;
}
async function main(compiler, next) {
    let bootFile = 'lib/internal/bootstrap_node.js';
    const { version } = compiler.target;
    if (version.startsWith('4.')) {
        bootFile = 'src/node.js';
    }
    else if (util_1.semverGt(version, '11.99')) {
        bootFile = 'lib/internal/bootstrap/pre_execution.js';
    }
    else if (util_1.semverGt(version, '9.10.1')) {
        bootFile = 'lib/internal/bootstrap/node.js';
    }
    const file = await compiler.readFileAsync(bootFile), ast = cherow_1.parse(file.contents.toString(), {
        loc: true,
        tolerant: true,
        next: true,
        globalReturn: true,
        node: true,
        skipShebang: true,
    }), location = { start: { line: 0 } };
    walkSome(ast, (node) => {
        if (!location.start.line && node.type === 'BlockStatement') {
            //Find the first block statement and mark the location
            Object.assign(location, node.loc);
            return true;
        }
    });
    const fileLines = file.contents.toString().split('\n');
    fileLines.splice(location.start.line, 0, "if (true) {\n  const __nexe_patches = (process.nexe = { patches: {} }).patches\n  const slice = [].slice\n  const __nexe_noop_patch = function (original) {\n    const args = slice.call(arguments, 1)\n    return original.apply(this, args)\n  }\n  const __nexe_patch = function (obj, method, patch) {\n    const original = obj[method]\n    if (!original) return\n    __nexe_patches[method] = patch\n    obj[method] = function() {\n      const args = [original].concat(slice.call(arguments))\n      return __nexe_patches[method].apply(this, args)\n    }\n  }\n  __nexe_patch((process).binding('fs'), 'internalModuleReadFile', __nexe_noop_patch)\n  __nexe_patch((process).binding('fs'), 'internalModuleReadJSON', __nexe_noop_patch)\n  __nexe_patch((process).binding('fs'), 'internalModuleStat', __nexe_noop_patch)\n}\n" +
        '\n' +
        (util_1.semverGt(version, '11.99') ? 'expandArgv1 = false;\n' : ''));
    file.contents = fileLines.join('\n');
    if (util_1.semverGt(version, '11.99')) {
        if (util_1.semverGt(version, '12.17.99')) {
            await compiler.replaceInFileAsync(bootFile, 'initializeFrozenIntrinsics();', 'initializeFrozenIntrinsics();\n' + util_1.wrap("\"use strict\";\nconst fs = require('fs'), fd = fs.openSync(process.execPath, 'r'), stat = fs.statSync(process.execPath), tailSize = Math.min(stat.size, 16000), tailWindow = Buffer.from(Array(tailSize));\nfs.readSync(fd, tailWindow, 0, tailSize, stat.size - tailSize);\nconst footerPosition = tailWindow.indexOf('<nexe~~sentinel>');\nif (footerPosition == -1) {\n    throw 'Invalid Nexe binary';\n}\nconst footer = tailWindow.slice(footerPosition, footerPosition + 32), contentSize = footer.readDoubleLE(16), resourceSize = footer.readDoubleLE(24), contentStart = stat.size - tailSize + footerPosition - resourceSize - contentSize, resourceStart = contentStart + contentSize;\nObject.defineProperty(process, '__nexe', (function () {\n    let nexeHeader = null;\n    return {\n        get: function () {\n            return nexeHeader;\n        },\n        set: function (value) {\n            if (nexeHeader) {\n                throw new Error('This property is readonly');\n            }\n            nexeHeader = Object.assign({}, value, {\n                blobPath: process.execPath,\n                layout: {\n                    stat,\n                    contentSize,\n                    contentStart,\n                    resourceSize,\n                    resourceStart,\n                },\n            });\n            Object.freeze(nexeHeader);\n        },\n        enumerable: false,\n        configurable: false,\n    };\n})());\nconst contentBuffer = Buffer.from(Array(contentSize)), Module = require('module');\nfs.readSync(fd, contentBuffer, 0, contentSize, contentStart);\nfs.closeSync(fd);\nnew Module(process.execPath, null)._compile(contentBuffer.toString(), process.execPath);\n"));
        }
        else {
            await compiler.replaceInFileAsync(bootFile, 'initializePolicy();', 'initializePolicy();\n' + util_1.wrap("\"use strict\";\nconst fs = require('fs'), fd = fs.openSync(process.execPath, 'r'), stat = fs.statSync(process.execPath), tailSize = Math.min(stat.size, 16000), tailWindow = Buffer.from(Array(tailSize));\nfs.readSync(fd, tailWindow, 0, tailSize, stat.size - tailSize);\nconst footerPosition = tailWindow.indexOf('<nexe~~sentinel>');\nif (footerPosition == -1) {\n    throw 'Invalid Nexe binary';\n}\nconst footer = tailWindow.slice(footerPosition, footerPosition + 32), contentSize = footer.readDoubleLE(16), resourceSize = footer.readDoubleLE(24), contentStart = stat.size - tailSize + footerPosition - resourceSize - contentSize, resourceStart = contentStart + contentSize;\nObject.defineProperty(process, '__nexe', (function () {\n    let nexeHeader = null;\n    return {\n        get: function () {\n            return nexeHeader;\n        },\n        set: function (value) {\n            if (nexeHeader) {\n                throw new Error('This property is readonly');\n            }\n            nexeHeader = Object.assign({}, value, {\n                blobPath: process.execPath,\n                layout: {\n                    stat,\n                    contentSize,\n                    contentStart,\n                    resourceSize,\n                    resourceStart,\n                },\n            });\n            Object.freeze(nexeHeader);\n        },\n        enumerable: false,\n        configurable: false,\n    };\n})());\nconst contentBuffer = Buffer.from(Array(contentSize)), Module = require('module');\nfs.readSync(fd, contentBuffer, 0, contentSize, contentStart);\nfs.closeSync(fd);\nnew Module(process.execPath, null)._compile(contentBuffer.toString(), process.execPath);\n"));
        }
        await compiler.replaceInFileAsync(bootFile, 'assert(!CJSLoader.hasLoadedAnyUserCJSModule)', '/*assert(!CJSLoader.hasLoadedAnyUserCJSModule)*/');
        const { contents: nodeccContents } = await compiler.readFileAsync('src/node.cc');
        if (nodeccContents.includes('if (env->worker_context() != nullptr) {')) {
            await compiler.replaceInFileAsync('src/node.cc', 'if (env->worker_context() != nullptr) {', 'if (env->worker_context() == nullptr) {\n' +
                '  return StartExecution(env, "internal/main/run_main_module"); } else {\n');
        }
        else {
            await compiler.replaceInFileAsync('src/node.cc', 'MaybeLocal<Value> StartMainThreadExecution(Environment* env) {', 'MaybeLocal<Value> StartMainThreadExecution(Environment* env) {\n' +
                '  return StartExecution(env, "internal/main/run_main_module");\n');
        }
    }
    else {
        await compiler.setFileContentsAsync('lib/_third_party_main.js', "\"use strict\";\nconst fs = require('fs'), fd = fs.openSync(process.execPath, 'r'), stat = fs.statSync(process.execPath), tailSize = Math.min(stat.size, 16000), tailWindow = Buffer.from(Array(tailSize));\nfs.readSync(fd, tailWindow, 0, tailSize, stat.size - tailSize);\nconst footerPosition = tailWindow.indexOf('<nexe~~sentinel>');\nif (footerPosition == -1) {\n    throw 'Invalid Nexe binary';\n}\nconst footer = tailWindow.slice(footerPosition, footerPosition + 32), contentSize = footer.readDoubleLE(16), resourceSize = footer.readDoubleLE(24), contentStart = stat.size - tailSize + footerPosition - resourceSize - contentSize, resourceStart = contentStart + contentSize;\nObject.defineProperty(process, '__nexe', (function () {\n    let nexeHeader = null;\n    return {\n        get: function () {\n            return nexeHeader;\n        },\n        set: function (value) {\n            if (nexeHeader) {\n                throw new Error('This property is readonly');\n            }\n            nexeHeader = Object.assign({}, value, {\n                blobPath: process.execPath,\n                layout: {\n                    stat,\n                    contentSize,\n                    contentStart,\n                    resourceSize,\n                    resourceStart,\n                },\n            });\n            Object.freeze(nexeHeader);\n        },\n        enumerable: false,\n        configurable: false,\n    };\n})());\nconst contentBuffer = Buffer.from(Array(contentSize)), Module = require('module');\nfs.readSync(fd, contentBuffer, 0, contentSize, contentStart);\nfs.closeSync(fd);\nnew Module(process.execPath, null)._compile(contentBuffer.toString(), process.execPath);\n");
    }
    return next();
}
exports.default = main;
