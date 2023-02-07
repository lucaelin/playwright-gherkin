import Gherkin from '@cucumber/gherkin';
import {IdGenerator, Pickle, PickleStep} from '@cucumber/messages';  
import { PlaywrightTestArgs, PlaywrightTestOptions, PlaywrightWorkerArgs, PlaywrightWorkerOptions } from '@playwright/test';

const uuidFn = IdGenerator.uuid();
const builder = new Gherkin.AstBuilder(uuidFn);
const matcher = new Gherkin.GherkinClassicTokenMatcher();
const parser = new Gherkin.Parser(builder, matcher);

export function generateCode(uri: string, feature: string): string {
  const gherkinDocument = parser.parse(feature);
  const pickles = Gherkin.compile(gherkinDocument, uri, uuidFn) as Pickle[];

  return genFile(uri, gherkinDocument.feature?.name ?? 'Feature', pickles).join('\n');
}

type PlaywrightArgs = PlaywrightTestArgs & PlaywrightTestOptions & PlaywrightWorkerArgs & PlaywrightWorkerOptions;
const playwrightArgs = ['page', 'browser', 'context', 'request'] satisfies readonly (keyof PlaywrightArgs)[];

function genStep(step: PickleStep): string[] {
  const rowMajor = step.argument?.dataTable?.rows.map(row=>row.cells.map(cell=>cell.value));
  const docString = step.argument?.docString;
  const findArgs: string[] = [
    JSON.stringify(step.type) ?? 'undefined', 
    JSON.stringify(step.text)
  ];
  const testArgs: string[] = [
    `{${playwrightArgs.join(', ')}, table: new DataTable(${JSON.stringify(rowMajor)}), docString: ${JSON.stringify(docString)}}`, 
    `info`
  ]

  return [
    `steps.find(${findArgs.join(', ')})`,
    `    (${testArgs.join(', ')});`
  ]
}

function genTest(pickle: Pickle): string[] {
  const steps = pickle.steps.flatMap(step => genStep(step));
  return [
    `test(${JSON.stringify(pickle.name)}, async ({${playwrightArgs.join(', ')}}, info)=>{`,
      ...indent(steps),
    `})`,
  ]
}

function genDescribe(name: string, pickles: Pickle[]): string[] {
  const tests = pickles.flatMap(pickle=>genTest(pickle));
  return [
    `test.describe(${JSON.stringify(name)}, async ()=>{`,
      ...indent(tests),
    `})`,
  ];
}

function genFile(uri: string, name: string, pickles: Pickle[]): string[] {
  return [
    `/* DO NOT EDIT! THIS FILE WAS GENERATED BY 'playwright-gherkin'. */`,
    `import {DataTable, validate} from 'playwright-gherkin';`,
    `import {steps} from './steps';`,
    //`validate(${JSON.stringify(uri)}, ${JSON.stringify(hash)})`,
    ``,
    ...genDescribe(name, pickles),
  ];
}

function genValidator(uri: string, hash: string): string[] {
  return [
    `import {readFile} from 'node:fs/promises';`,
    `import {createHash} from 'node:crypto';`,
    `const originFeatureHash = await readFile(${uri}).then(res=>createHash('sha256').update(res.toString('utf8')).digest('hex'));`,
    `if (originFeatureHash !== ${JSON.stringify('aaa')}) throw new Error('Feature-spec out of sync')`,
  ]
}

function indent(content: string[]): string[] {
  return content.map(s=>'    '+s)
}
