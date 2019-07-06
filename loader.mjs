import path from 'path';
import process from 'process';
import Module from 'module';
import https from 'https';
import os from 'os';
import fs from 'fs';

const __tmpdir = os.tmpdir();

function rand(){
    return Math.random().toString(36).substring(2, 15)
}

function httpsDownload(url, file){
    return new Promise((resolve, reject) => {
        const fws = fs.createWriteStream(file);
        https.get(url, response => {
            response.pipe(fws);
            fws.on('finish', () => fws.close(resolve))
        }).on('error', err => {
            fs.unlink(file);
            reject(err)
        })
    })
}

// will contain module file url and real url pairs
const httpsModuleLinksStore = {};

async function httpsDownloadModule(url){
    const modulePath = path.resolve(__tmpdir, rand() + '.mjs');
    await httpsDownload(url, modulePath);
    httpsModuleLinksStore[new URL(`${modulePath}`, 'file://').href] = url;
    return modulePath
}

const builtins = Module.builtinModules;
const JS_EXTENSIONS = new Set(['.js', '.mjs']);

const baseURL = new URL(`${process.cwd()}/`, 'file://').href;

export function resolve(specifier, parentModuleURL = baseURL, defaultResolve){
    if (builtins.includes(specifier)) return {
        url: specifier,
        format: 'builtin'
    }

    if(specifier.startsWith('https://') || (
        parentModuleURL in httpsModuleLinksStore &&
        /^\.\.?/.test(specifier)
    )){
        return {
            url: new URL(specifier, httpsModuleLinksStore[parentModuleURL]).href,
            format: 'dynamic',
        }
    }

    if (/^\.{0,2}[/]/.test(specifier) !== true && !specifier.startsWith('file:')) throw new Error(`imports must begin with '/', './', or '../'; '${specifier}' does not`);

    const resolved = new URL(specifier, parentModuleURL);
    const ext = path.extname(resolved.pathname);

    if (!JS_EXTENSIONS.has(ext)) throw new Error(`Cannot load file with non-JavaScript file extension ${ext}.`);

    return {
        url: resolved.href,
        format: 'module'
    }
}

export async function dynamicInstantiate(url){
    const fname = await httpsDownloadModule(url);
    const exp = await import(fname);
    fs.unlink(fname, () => {});
    const exports = Object.getOwnPropertyNames(exp);
    return {
        exports,
        execute: (exportObj) => {
            exports.forEach(name => {
                exportObj[name].set(exp[name])
            })
        }
    }
}
