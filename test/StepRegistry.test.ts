import {expect} from 'chai';
import {StepRegistry} from '../src/StepRegistry.js';

describe('StepRegistry', ()=>{
  it('handles a step', ()=>{
    const steps = new StepRegistry();
    const stepfn = async () =>{}

    steps.define('Given a step', stepfn);

    expect(steps.find('Context', 'a step')).to.equal(stepfn);
  });
  it('handles all step types', ()=>{
    const steps = new StepRegistry();
    const stepfnG = async () =>{}
    const stepfnW = async () =>{}
    const stepfnT = async () =>{}

    steps.define('Given a step', stepfnG);
    steps.define('When a step', stepfnW);
    steps.define('Then a step', stepfnT);

    expect(steps.find('Context', 'a step')).to.equal(stepfnG);
    expect(steps.find('Action', 'a step')).to.equal(stepfnW);
    expect(steps.find('Outcome', 'a step')).to.equal(stepfnT);
  });
  it('handles multiple steps of the same type', ()=>{
    const steps = new StepRegistry();
    const stepfn1 = async () =>{}
    const stepfn2 = async () =>{}

    steps.define('Given a first step', stepfn1);
    steps.define('Given a second step', stepfn2);

    expect(steps.find('Context', 'a first step')).to.equal(stepfn1);
    expect(steps.find('Context', 'a second step')).to.equal(stepfn2);
  });
  it('handles a step with localization', ()=>{
    const steps = new StepRegistry('de');
    const stepfn = async () =>{}

    steps.define('Angenommen es gibt einen Schritt', stepfn);

    expect(steps.find('Context', 'es gibt einen Schritt')).to.equal(stepfn);
  });
  it('chains steps with and', ()=>{
    const steps = new StepRegistry();
    const stepfn1 = async () =>{}
    const stepfn2 = async () =>{}

    steps.define('Given a step', stepfn1)
    steps.define('And another one', stepfn2);

      expect(steps.find('Context', 'a step')).to.equal(stepfn1);
      expect(steps.find('Context', 'another one')).to.equal(stepfn2);
  });

  it('throws if a step cannot be found', () => {
    const steps = new StepRegistry();
    expect(() => steps.find('Context', 'invalid')).to.throw('Unable to find "Context": invalid');
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