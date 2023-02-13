import Gherkin from '@cucumber/gherkin';
import {GherkinDocument, IdGenerator, Pickle, PickleStep} from '@cucumber/messages';  
import { PlaywrightTestArgs, PlaywrightTestOptions, PlaywrightWorkerArgs, PlaywrightWorkerOptions } from '@playwright/test';
import { parameterize } from './StepRegistry.js';

const uuidFn = IdGenerator.uuid();
const builder = new Gherkin.AstBuilder(uuidFn);
const matcher = new Gherkin.GherkinClassicTokenMatcher();
const parser = new Gherkin.Parser(builder, matcher);

export function generateCode(uri: string, feature: string): string {
  const gherkinDocument = parser.parse(feature);
  const pickles = Gherkin.compile(gherkinDocument, uri, uuidFn) as Pickle[];

  return genFile(uri, gherkinDocument, pickles).join('\n');
}

type PlaywrightArgs = PlaywrightTestArgs & PlaywrightTestOptions & PlaywrightWorkerArgs & PlaywrightWorkerOptions;
const playwrightArgs = ['page', 'browser', 'context', 'request'] satisfies readonly (keyof PlaywrightArgs)[];

function genStep(step: PickleStep): string[] {
  const rowMajor = step.argument?.dataTable?.rows.map(row=>row.cells.map(cell=>cell.value));
  const docString = step.argument?.docString;
  const findArgs = parameterize(step.type as "Context" | "Action" | "Outcome", step.text);
  const testArgs: string[] = [
    `{${playwrightArgs.join(', ')}, table: new DataTable(${JSON.stringify(rowMajor)}), docString: ${JSON.stringify(docString)}, wildcards: ${JSON.stringify(findArgs.values)}}`, 
    `info`
  ]

  return [
    `await steps.find(${JSON.stringify(findArgs)})`,
    `    (${testArgs.join(', ')});`
  ]
}

function genTest(pickle: Pickle): string[] {
  const steps = pickle.steps.flatMap(step => genStep(step));
  const tags = pickle.tags.map(t=>t.name);
  return [
    `test(${JSON.stringify(`${pickle.name} ${tags.join(' ')}`.trim())}, async ({${playwrightArgs.join(', ')}}, info)=>{`,
      ...indent([`test.setTimeout(${pickle.steps.length} * info.timeout);`, ...steps]),
    `})`,
  ]
}

function genDescribe(name: string, tags: string[], pickles: Pickle[]): string[] {
  const tests = pickles.flatMap(pickle=>genTest(pickle));
  return [
    `test.describe(${JSON.stringify(`${name} ${tags.join(' ')}`.trim())}, async ()=>{`,
      ...indent(tests),
    `})`,
  ];
}

function genFile(uri: string, document: GherkinDocument, pickles: Pickle[]): string[] {
  const name = document.feature?.name ?? 'Feature';
  const tags = document.feature?.tags?.map(t=>t.name) ?? [];
  return [
    `/* DO NOT EDIT! THIS FILE WAS GENERATED BY 'playwright-gherkin'. */`,
    `import {test} from '@playwright/test';`,
    `import {DataTable} from 'playwright-gherkin';`,
    `import {steps} from './steps.js';`,
    //`validate(${JSON.stringify(uri)}, ${JSON.stringify(hash)})`,
    ``,
    ...genDescribe(name, tags, pickles),
  ];
}

function indent(content: string[]): string[] {
  return content.map(s=>'    '+s)
}
