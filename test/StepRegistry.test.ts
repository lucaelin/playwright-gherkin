import {expect} from 'chai';
import {StepRegistry} from '../src/StepRegistry.js';

describe('StepRegistry', ()=>{
  it('handles a step', ()=>{
    const steps = new StepRegistry();
    const stepfn = async () =>{}

    steps.define('Given a step', stepfn);

    expect(steps.find({type: 'Context', originalText: 'a step'})).to.equal(stepfn);
  });
  it('handles all step types', ()=>{
    const steps = new StepRegistry();
    const stepfnG = async () =>{}
    const stepfnW = async () =>{}
    const stepfnT = async () =>{}

    steps.define('Given a step', stepfnG);
    steps.define('When a step', stepfnW);
    steps.define('Then a step', stepfnT);

    expect(steps.find({type: 'Context', originalText: 'a step'})).to.equal(stepfnG);
    expect(steps.find({type: 'Action', originalText: 'a step'})).to.equal(stepfnW);
    expect(steps.find({type: 'Outcome', originalText: 'a step'})).to.equal(stepfnT);
  });
  it('handles multiple steps of the same type', ()=>{
    const steps = new StepRegistry();
    const stepfn1 = async () =>{}
    const stepfn2 = async () =>{}

    steps.define('Given a first step', stepfn1);
    steps.define('Given a second step', stepfn2);

    expect(steps.find({type: 'Context', originalText: 'a first step'})).to.equal(stepfn1);
    expect(steps.find({type: 'Context', originalText: 'a second step'})).to.equal(stepfn2);
  });
  it('handles a step with localization', ()=>{
    const steps = new StepRegistry('de');
    const stepfn = async () =>{}

    steps.define('Angenommen es gibt einen Schritt', stepfn);

    expect(steps.find({type: 'Context', originalText: 'es gibt einen Schritt'})).to.equal(stepfn);
  });
  it('chains steps with and', ()=>{
    const steps = new StepRegistry();
    const stepfn1 = async () =>{}
    const stepfn2 = async () =>{}

    steps.define('Given a step', stepfn1)
    steps.define('And another one', stepfn2);

      expect(steps.find({type: 'Context', originalText: 'a step'})).to.equal(stepfn1);
      expect(steps.find({type: 'Context', originalText: 'another one'})).to.equal(stepfn2);
  });
  it('handels steps with parameters', ()=>{
    const steps = new StepRegistry();
    const stepfn = async () =>{}

    steps.define('Given a "{}"', stepfn)

    expect(steps.find({type: 'Context', originalText: 'a "something"', escapedText: 'a "{}"'})).to.equal(stepfn);
  });
  it('prefer steps without parameters', ()=>{
    const steps = new StepRegistry();
    const stepfn1 = async () =>{}
    const stepfn2 = async () =>{}

    steps.define('Given a "{}"', stepfn1)
    steps.define('Given a "something"', stepfn2)

    expect(steps.find({type: 'Context', originalText: 'a "something"', escapedText: 'a "{}"'})).to.equal(stepfn2);
  });

  it('throws if a step cannot be found', () => {
    const steps = new StepRegistry();
    expect(() => steps.find({type: 'Context', originalText: 'invalid'})).to.throw('Unable to find "Context": invalid');
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