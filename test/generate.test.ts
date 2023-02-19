import {expect} from 'chai';
import {Spec, Feature, Scenario} from '../src/parse.js';
import {generateCode} from '../src/generate.js';
import { simulate } from './simulate.js';

type DeepPartial<T> = T extends object ? {
  [key in keyof T]?: DeepPartial<T[key]>;
} : T;

function defaultSpec(spec: DeepPartial<Spec>): Spec {
  return {
    uri: '',
    language: 'en',
    comments: [],
    ...spec,
    features: spec?.features?.map((feat)=>({
      name: 'Feature 1',
      language: 'en',
      keyword: 'Feature',
      description: '',
      tags: [],
      location: {line: 0, column: 0},
      ...feat,
      scenarios: feat?.scenarios?.map((scn)=>({
        name: 'Scenario 1',
        tags: [],
        location: {line: 0, column: 0},
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
    expect(trace[2].call).to.equal('steps.find');
    expect(trace[2].step.text).to.equal('Step 1');
    expect(trace[2].step.keyword).to.equal('');
    expect(trace[3].call).to.equal('steps.find.call');
    expect(trace[3].pw.world).to.deep.equal({});
  });
}) 