"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnBuiltReleases = exports.getLatestGitRelease = void 0;
const got = require("got");
const target_1 = require("./target");
const versionsToSkip = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 13, 15, 17, 19, 21, 22];
async function getJson(url, options) {
    return JSON.parse((await got(url, options)).body);
}
function isBuildableVersion(version) {
    if (version === '12.11.0') {
        return false;
    }
    return !versionsToSkip.includes(Number(version.split('.')[0]));
}
function getLatestGitRelease(options) {
    return getJson('https://api.github.com/repos/nexe/nexe/releases/latest', options);
}
exports.getLatestGitRelease = getLatestGitRelease;
async function getUnBuiltReleases(options) {
    const nodeReleases = await getJson('https://nodejs.org/download/release/index.json');
    const existingVersions = (await getLatestGitRelease(options)).assets.map((x) => target_1.getTarget(x.name));
    const versionMap = {};
    return nodeReleases
        .reduce((versions, { version }) => {
        version = version.replace('v', '').trim();
        if (!isBuildableVersion(version) || versionMap[version]) {
            return versions;
        }
        versionMap[version] = true;
        target_1.platforms.forEach((platform) => {
            target_1.architectures.forEach((arch) => {
                if (arch === 'x86' && platform === 'mac')
                    return;
                if (arch.includes('arm'))
                    return;
                versions.push(target_1.getTarget({ platform, arch, version }));
            });
        });
        return versions;
    }, [])
        .filter((x) => !existingVersions.some((t) => target_1.targetsEqual(t, x)));
}
exports.getUnBuiltReleases = getUnBuiltReleases;
