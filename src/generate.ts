import { PlaywrightTestArgs, PlaywrightTestOptions, PlaywrightWorkerArgs, PlaywrightWorkerOptions } from '@playwright/test';
import { Spec,Feature,  Scenario,  Step, } from './parse.js';
import { SourceMapGenerator } from 'source-map';

type PlaywrightArgs = PlaywrightTestArgs & PlaywrightTestOptions & PlaywrightWorkerArgs & PlaywrightWorkerOptions;
const playwrightArgs = ['page', 'browser', 'context', 'request'] satisfies readonly (keyof PlaywrightArgs)[];

type LocationMarker = {line: number, step: string};

type Code = (string|LocationMarker|Code)[]

function genStep(step: Step): Code {
  return [
    {line: step.location?.line || 1, step: step.originalText},
    `{ // ${JSON.stringify(step.originalText)}`,
    [
      `const table = ${step.table?`new DataTable(${JSON.stringify(step.table)})`:'undefined'};`,
      `const docString = ${JSON.stringify(step.docString)};`,
      `const expressions = ${JSON.stringify(step.expressions)}`,
      `const arg1 = {${playwrightArgs.join(', ')}, table, docString, expressions, world};`,
      `const step = await steps.find(${JSON.stringify(step)});`,
      `const timeout = info.timeout ? new Promise((_, rej)=>setTimeout(()=>rej(new Error('Step timeout reached after '+info.timeout+'ms')), info.timeout)) : undefined;`,
      `await Promise.race([step(arg1, info), timeout].filter(p=>p));`,
    ],
    `}`,
  ]

}

function genScenario(scn: Scenario): Code {
  const tests = scn.steps.flatMap(step=>genStep(step));
  return [
    {line: scn.location?.line || 1, step: scn.name},
    `test(${JSON.stringify(`${scn.name} ${scn.tags.join(' ')}`.trim())}, async ({${playwrightArgs.join(', ')}}, info)=>{`,
    [
        `test.setTimeout(${scn.steps.length} * info.timeout);`,
        `const world = {};`,
        ...tests,
    ],
    `})`,
  ];
}

function genFeature(spec: Spec): Code {
  const describes = spec.features[0].scenarios.map(scn=>genScenario(scn));
  return [
    `/* DO NOT EDIT! THIS FILE WAS GENERATED BY 'playwright-gherkin'. */`,
    `import {test} from '@playwright/test';`,
    `import {DataTable} from 'playwright-gherkin';`,
    `import {steps} from './steps.js';`,
    //`validate(${JSON.stringify(uri)}, ${JSON.stringify(hash)})`,
    ``,
    {line: spec.features[0].location?.line || 1, step: spec.features[0].name},
    `test.describe(${JSON.stringify(`${spec.features[0].name} ${spec.features[0].tags.join(' ')}`.trim())}, ()=>{`,
    ...describes,
    `})`,
  ];
}

export function generateCode(spec: Spec) {
  const block = genFeature(spec);
  const lines: string[] = [];
  const map: {original: LocationMarker, generated: {line: number, column: number}}[] = [];
  flattenBlock(block, map, lines);

  const sourcemap = new SourceMapGenerator({
    file: spec.uri,
  });
  sourcemap.setSourceContent(spec.uri, spec.content);
  for (const {generated, original} of map) {
    sourcemap.addMapping({
      generated, 
      original: {column: 0, ...original}, 
      source: spec.uri,
      name: original.step || undefined,
    })
  }

  
  return lines.join('\n')
    +'\n\n'
    +'//# sourceMappingURL=data:application/json;charset=utf-8;base64,'+btoa(sourcemap.toString());
}

function flattenBlock(
  block: Code, 
  map: {original: LocationMarker, generated: {line: number, column: number}}[], 
  output: string[], 
  level: number = 0, 
  currentLocation: LocationMarker = {line: 1, step: ''}
): string[] {
  const indentation = new Array(level).fill(' ').join('');
  for (const line of block) {
    if (typeof line === 'string') {
      output.push(`${indentation}${line}`);
      map.push({
        original: currentLocation, 
        generated: {line: output.length, column:0}, 
      });
    } 
    if (typeof line === 'object') {
      if (line instanceof Array) {
        flattenBlock(line, map, output, level+4, currentLocation);
      } else {
        currentLocation = line;
      }
    }
  }
  return output;
}