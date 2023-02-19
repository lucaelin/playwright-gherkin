import {readFile, writeFile} from 'node:fs/promises';
import glob from 'glob';
import {generateCode} from './generate.js';
import {createHash} from 'node:crypto';
import { parseFeature } from './parse.js';

export {DataTable} from './DataTable.js';
export {StepRegistry} from './StepRegistry.js';

export async function generateSpec(inputPath: string, outputPath: string) {
  const feature = await readFile(inputPath).then(res=>res.toString('utf8'));
  const code = generateCode(parseFeature(inputPath, feature));
  await writeFile(outputPath, code);
}

export async function generateSpecs(inputGlob: string) {
  const inputPaths = glob.sync(inputGlob);
  for (const inputPath of inputPaths) {
    const feature = await readFile(inputPath).then(res=>res.toString('utf8'));
    const code = generateCode(parseFeature(inputPath, feature));
    await writeFile(inputPath+'.js', code);
  }
}
