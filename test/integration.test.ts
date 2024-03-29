import {expect} from 'chai';
import {parseFeature} from '../src/parse.js';
import {generateCode} from '../src/generate.js';
import { simulate } from './simulate.js';
import { GherkinArgs, PlaywrightArgs, StepRegistry, PlaywrightTestInfo } from '../src/StepRegistry.js';
import { DataTable } from '../src/DataTable.js';

describe('integration', ()=>{
  it('runs a feature from file-contents', async ()=>{
    const spec = parseFeature('test.feature', `
      Feature: Development
        Scenario: Testing
          Given good software
          When you test it
          Then it works
          | well |
          And you are "very happy"
    `);

    const code = generateCode(spec);
    const steps = new StepRegistry('en', {value: false});

    const stepCalls: {name: string, pw: PlaywrightArgs & GherkinArgs, info: PlaywrightTestInfo}[] = [];

    steps.define('Given good software', async (pw, info)=>{
      pw.world.value = true; 
      stepCalls.push({name: 'Given good software', pw, info});
    });
    steps.define('When you {} it', async (pw, info)=>{
      stepCalls.push({name: 'When you {} it', pw, info});
    });
    steps.define('Then it works', async (pw, info)=>{
      stepCalls.push({name: 'Then it works', pw, info});
    });
    steps.define('Then you are {}', async (pw, info)=>{
      stepCalls.push({name: 'Then you are {}', pw, info});
    });

    const trace = await simulate(code, {steps, DataTable});

    expect(stepCalls).to.have.lengthOf(4);
    expect(stepCalls[0].name).to.equal('Given good software');
    expect(stepCalls[1].name).to.equal('When you {} it');
    expect(stepCalls[1].pw.step.tokens).to.deep.equal(['When', 'you', 'test', 'it']);
    expect(stepCalls[2].name).to.equal('Then it works');
    expect(stepCalls[2].pw.table!.rowMajor).to.deep.equal([['well']]);
    expect(stepCalls[3].name).to.equal('Then you are {}');
    expect(stepCalls[3].pw.parameters).to.deep.equal(['very happy']);
    expect(stepCalls[3].pw.world.value).to.equal(true);
  });

  it('resets the world between runs', async ()=>{
    const spec = parseFeature('test.feature', `
      Feature: Development
        Scenario: Testing 1
          When you test it
        Scenario: Testing 2
          When you test it
    `);

    const code = generateCode(spec);
    const steps = new StepRegistry('en', {value: false});

    steps.define('When you test it', async (pw, info)=>{
      expect(pw.world.value).to.be.false;
      pw.world.value = true; 
    });

    await simulate(code, {steps, DataTable});
  });
}) 