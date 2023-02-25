import {expect} from 'chai';
import {Spec, Feature, Scenario} from '../src/parse.js';
import {generateDeclaration} from '../src/declaration.js';
import { defaultSpec } from './util.js';

describe('declaration', ()=>{
  it('generates a declaration containing all steps', async ()=>{
    const spec = defaultSpec({
      features: [{
        scenarios: [{
          name: 'Scenario 1',
          steps: [{
            originalText: 'When Step 1',
          },{
            originalText: 'Then Step 2',
          },{
            originalText: 'And Step 3',
          }]
        }]
      }]
    }) as Spec; 

    const declaration = generateDeclaration(spec);

    const steps = JSON.parse('['+ declaration.match(/export type Steps = \[([^\]]*)\]/)?.[1] + ']');
    console.log(steps);

    expect(steps).to.equal(['When Step 1', 'Then Step 2', 'Then Step 3']);
  });
}) 