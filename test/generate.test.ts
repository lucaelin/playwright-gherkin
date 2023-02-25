import {expect} from 'chai';
import {Spec, Feature, Scenario} from '../src/parse.js';
import {generateCode} from '../src/generate.js';
import { simulate } from './simulate.js';
import { SourceMapConsumer } from 'source-map';

type DeepPartial<T> = T extends object ? {
  [key in keyof T]?: DeepPartial<T[key]>;
} : T;

function defaultSpec(spec: DeepPartial<Spec>): Spec {
  return {
    uri: 'test.feature',
    content: '',
    language: 'en',
    comments: [],
    ...spec,
    features: spec?.features?.map((feat)=>({
      name: 'Feature 1',
      language: 'en',
      keyword: 'Feature',
      description: '',
      tags: [],
      location: {line: 1, column: 0},
      ...feat,
      scenarios: feat?.scenarios?.map((scn)=>({
        name: 'Scenario 1',
        tags: [],
        location: {line: 1, column: 0},
        ...scn,
        steps: scn?.steps?.map((step)=>({
          text: 'Step 1',
          location: {},
          keyword: '',
          originalKeyword: '',
          originalText: '',
          expressionText: '',
          type: 'Unknown',
          ...step,
        }))
      }))
    }))
  } as Spec;
}

describe('generate', ()=>{
  it('generates a valid spec', async ()=>{
    const spec = defaultSpec({
      features: [{
        scenarios: [{
          name: 'Scenario 1',
          steps: [{
            text: 'Step 1',
          }]
        }]
      }]
    }) as Spec; 

    const code = generateCode(spec);
    const trace = await simulate(code);
    expect(trace[0].call).to.equal('test.describe');
    expect(trace[0].name).to.equal('Feature 1');
    expect(trace[1].call).to.equal('test');
    expect(trace[1].name).to.equal('Scenario 1');
    expect(trace[2].call).to.equal('test.setTimeout');
    expect(trace[2].timeout).to.equal(100);
    expect(trace[3].call).to.equal('steps.find');
    expect(trace[3].step.text).to.equal('Step 1');
    expect(trace[3].step.keyword).to.equal('');
    expect(trace[4].call).to.equal('setTimeout');
    expect(trace[4].timeout).to.equal(100);
    expect(trace[5].call).to.equal('steps.find.call');
    expect(trace[5].pw.world).to.deep.equal({});
  });
  
  // TODO check this code when https://github.com/microsoft/playwright/issues/21204 is closed or fixed
  it.skip('generates a valid sourcemap', async ()=>{
    const spec = defaultSpec({
      content: `
        Feature: a
          Scenario: b
            When c
            Then d
      `,
      features: [{
        name: 'a',
        location: {line: 2},
        scenarios: [{
          name: 'b',
          location: {line: 3},
          steps: [{
            location: {line: 4},
            text: 'c',
          },{
            location: {line: 5},
            text: 'd',
          }]
        }]
      }]
    }) as Spec; 

    const lines = generateCode(spec).split('\n');
    const sourcemapLine = lines.at(-1);
    expect(sourcemapLine).to.satisfy((s: string)=>s.startsWith('//# sourceMappingURL=data:application/json;charset=utf-8;base64,'));
    
    const sourcemapJson = JSON.parse(atob(sourcemapLine?.split(',').at(-1)!));
    const consumer = await new SourceMapConsumer(sourcemapJson);
    consumer.computeColumnSpans();

    for (const line of [2,3,4,5]) {
      const generatedPreviousLine = consumer.allGeneratedPositionsFor({source: 'test.feature', line: line - 1, column: 0})[0].line!;
      const generatedLine = consumer.allGeneratedPositionsFor({source: 'test.feature', line, column: 0})[0].line;

      expect(generatedLine).to.be.greaterThan(generatedPreviousLine);
    }

    consumer.destroy();
  });
}) 