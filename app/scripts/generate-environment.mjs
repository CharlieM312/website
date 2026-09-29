import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const localEnvironmentPath = resolve('local.env');
let localEnvironment = {};

try {
    const contents = await readFile(localEnvironmentPath, 'utf8');
    localEnvironment = Object.fromEntries(
        contents
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'))
            .map(line => {
                const separator = line.indexOf('=');
                if (separator === -1) return [line, ''];

                const name = line.slice(0, separator).trim();
                const value = line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
                return [name, value];
            })
    );
} catch (error) {
    if (error.code !== 'ENOENT') throw error;
}

const apiKey = process.env.CARTO_API_KEY ?? localEnvironment.CARTO_API_KEY ?? '';

if (process.argv.includes('--required') && !apiKey) {
    throw new Error('CARTO_API_KEY is not set. Add it to app/local.env or the build environment.');
}

const outputDirectory = resolve('src/environments');
await mkdir(outputDirectory, { recursive: true });
await writeFile(
    resolve(outputDirectory, 'environment.generated.ts'),
    `export const environment = {\n    cartoApiKey: ${JSON.stringify(apiKey)}\n} as const;\n`
);