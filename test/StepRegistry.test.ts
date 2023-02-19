import {expect} from 'chai';
import {StepRegistry} from '../src/StepRegistry.js';
import { parameterize, parseStep } from '../src/parse.js';
import { dialects } from '@cucumber/gherkin';

describe('StepRegistry', ()=>{
  it('handles a step', ()=>{
    const steps = new StepRegistry();
    const stepfn = async () =>{}

    steps.define('Given a step', stepfn);

    expect(steps.find(parseStep('Given a step', dialects.en))).to.equal(stepfn);
  });
  it('handles all step types', ()=>{
    const steps = new StepRegistry();
    const stepfnG = async () =>{}
    const stepfnW = async () =>{}
    const stepfnT = async () =>{}

    steps.define('Given a step', stepfnG);
    steps.define('When a step', stepfnW);
    steps.define('Then a step', stepfnT);

    expect(steps.find(parseStep('Given a step', dialects.en))).to.equal(stepfnG);
    expect(steps.find(parseStep('When a step', dialects.en))).to.equal(stepfnW);
    expect(steps.find(parseStep('Then a step', dialects.en))).to.equal(stepfnT);
  });
  it('handles multiple steps of the same type', ()=>{
    const steps = new StepRegistry();
    const stepfn1 = async () =>{}
    const stepfn2 = async () =>{}

    steps.define('Given a first step', stepfn1);
    steps.define('Given a second step', stepfn2);

    expect(steps.find(parseStep('Given a first step', dialects.en))).to.equal(stepfn1);
    expect(steps.find(parseStep('Given a second step', dialects.en))).to.equal(stepfn2);
  });
  it('handles a step with localization', ()=>{
    const steps = new StepRegistry('de');
    const stepfn = async () =>{}

    steps.define('Angenommen es gibt einen Schritt', stepfn);

    expect(steps.find(parseStep('Angenommen es gibt einen Schritt', dialects.de))).to.equal(stepfn);
  });
  it('chains steps with and', ()=>{
    const steps = new StepRegistry();
    const stepfn1 = async () =>{}
    const stepfn2 = async () =>{}

    steps.define('Given a step', stepfn1)
    steps.define('And another one', stepfn2);

      expect(steps.find(parseStep('Given a step', dialects.en))).to.equal(stepfn1);
      expect(steps.find(parseStep('Given another one', dialects.en))).to.equal(stepfn2);
  });
  it('handels steps with parameters', ()=>{
    const steps = new StepRegistry();
    const stepfn = async () =>{}

    steps.define('Given a "{}"', stepfn)
    
    expect(steps.find(parseStep('Given a "step"', dialects.en))).to.equal(stepfn);
  });
  it('prefer steps without parameters', ()=>{
    const steps = new StepRegistry();
    const stepfn1 = async () =>{}
    const stepfn2 = async () =>{}

    steps.define('Given a "{}"', stepfn1)
    steps.define('Given a "something"', stepfn2)

    expect(steps.find(parseStep('Given a "something"', dialects.en))).to.equal(stepfn2);
  });
  it('allows step type checking', () => {
    const steps = new StepRegistry<['Given one step', 'Given a second step']>();
    const step = async () => {};
    steps.define('Given one step', step);

    // @ts-expect-error
    steps.define('Given invalid steps', step);

    expect(steps.find(parseStep('Given one step', dialects.en))).to.equal(step);
  });

  it('throws if a step cannot be found', () => {
    const steps = new StepRegistry();
    expect(() => steps.find(parseStep('Given invalid', dialects.en))).to.throw('Unable to find step: Given invalid');
  });
  it('throws if a step is already defined', () => {
    const steps = new StepRegistry();
    const step = async () => {};
    steps.define('Given a context', step);
    expect(() => steps.define('Given a context', step)).to.throw('Step already exists');
  });
  it('throws if it cannot parse a step', () => {
    const steps = new StepRegistry();
    const step = async () => {};
    expect(() => steps.define('Invalid step', step)).to.throw('Unable to parse: Invalid step');
  });
}) 