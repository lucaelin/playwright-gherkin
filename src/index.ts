import {readFile, writeFile} from 'node:fs/promises';
import glob from 'glob';
import {generateCode} from './generate.js';
import {createHash} from 'node:crypto';
import { parseFeature } from './parse.js';
import { generateDeclaration } from './declaration.js';

export {DataTable} from './DataTable.js';
export {StepRegistry} from './StepRegistry.js';

export async function generateSpec(inputPath: string) {
  const feature = await readFile(inputPath).then(res=>res.toString('utf8'));
  const spec = parseFeature(inputPath, feature);
  const code = generateCode(spec);
  await writeFile(inputPath+'.js', code);
  const declaration = generateDeclaration(spec);
  await writeFile(inputPath+'.d.ts', declaration);
}

export async function generateSpecs(inputGlob: string) {
  const inputPaths = glob.sync(inputGlob);
  for (const inputPath of inputPaths) {
    generateSpec(inputPath);
  }
}
