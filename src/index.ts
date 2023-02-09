import {readFile, writeFile} from 'node:fs/promises';
import glob from 'glob';
import {generateCode} from './generate.js';
import {createHash} from 'node:crypto';

export {DataTable} from './DataTable.js';
export {StepRegistry} from './StepRegistry.js';

export async function generateSpec(inputPath: string, outputPath: string) {
  const feature = await readFile(inputPath).then(res=>res.toString('utf8'));
  const code = generateCode(inputPath, feature);
  await writeFile(outputPath, code);
}

export async function generateSpecs(inputGlob: string) {
  const inputPaths = glob.sync(inputGlob);
  for (const inputPath of inputPaths) {
    const feature = await readFile(inputPath).then(res=>res.toString('utf8'));
    const code = generateCode(inputPath, feature);
    await writeFile(inputPath+'.js', code);
  }
}

export async function validate(uri: string, hash: string) {
  const fileHash = await readFile(uri).then(res=>createHash('sha256').update(res.toString('utf8')).digest('hex'));
  if (fileHash !== hash) throw new Error('Feature-spec out of sync')
}