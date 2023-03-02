import {expect} from 'chai';
import {StepRegistry, StepsDeclaration} from '../src/StepRegistry.js';
import { Step, parseStep } from '../src/parse.js';
import { dialects } from '@cucumber/gherkin';

describe('StepRegistry', ()=>{
  it('handles a step', ()=>{
    const steps = new StepRegistry();
    const stepfn = async () =>{}

    steps.define('Given a step', stepfn);

    expect(steps.find(parseStep('Given a step', dialects.en)).call).to.equal(stepfn);
  });
  it('handles all step types', ()=>{
    const steps = new StepRegistry();
    const stepfnG = async () =>{}
    const stepfnW = async () =>{}
    const stepfnT = async () =>{}

    steps.define('Given a step', stepfnG);
    steps.define('When a step', stepfnW);
    steps.define('Then a step', stepfnT);

    expect(steps.find(parseStep('Given a step', dialects.en)).call).to.equal(stepfnG);
    expect(steps.find(parseStep('When a step', dialects.en)).call).to.equal(stepfnW);
    expect(steps.find(parseStep('Then a step', dialects.en)).call).to.equal(stepfnT);
  });
  it('handles multiple steps of the same type', ()=>{
    const steps = new StepRegistry();
    const stepfn1 = async () =>{}
    const stepfn2 = async () =>{}

    steps.define('Given a first step', stepfn1);
    steps.define('Given a second step', stepfn2);

    expect(steps.find(parseStep('Given a first step', dialects.en)).call).to.equal(stepfn1);
    expect(steps.find(parseStep('Given a second step', dialects.en)).call).to.equal(stepfn2);
  });
  it('handles a step with localization', ()=>{
    const steps = new StepRegistry('de');
    const stepfn = async () =>{}

    steps.define('Angenommen es gibt einen Schritt', stepfn);

    expect(steps.find(parseStep('Angenommen es gibt einen Schritt', dialects.de)).call).to.equal(stepfn);
  });
  it('handels steps with parameters', ()=>{
    const steps = new StepRegistry();
    const stepfn = async () =>{}

    steps.define('Given a {}', stepfn)

    const step = steps.find(parseStep('Given a step', dialects.en));
    expect(step.call).to.equal(stepfn);
    expect(step.parameters).to.deep.equal(['step']);
  });
  it('allows step type checking', () => {
    const steps = new StepRegistry<[{tokens: ['Given', 'one', 'step'], text: 'Given one step'}]>();
    const step = async () => {};
    steps.define('Given one step', step);

    // @ts-expect-error
    steps.define('Given invalid step', step);

    expect(steps.find(parseStep('Given one step', dialects.en)).call).to.equal(step);
  });
  it('allows parameterized step type checking', () => {
    const steps = new StepRegistry<[{tokens: ['Given', 'step', 'one'], text: 'Given step one'}]>();
    const step = async () => {};
    steps.define('Given step {}', step);
    
    // @ts-expect-error
    steps.define('Given invalid {}', step);

    expect(steps.find(parseStep('Given step one', dialects.en)).call).to.equal(step);
  });
  it('allows parameterized step type checking', () => {
    const steps = new StepRegistry<[{tokens: ['Given', 'step', 'one'], text: 'Given step one'}]>();
    steps.define('Given step {}', async ({parameters})=>{
      // @ts-expect-error
      const p: ['invalid'] = parameters;
      const q: ['one'] = parameters;
    });
  });
  it('allows sanitizes parameter types', () => {
    const steps = new StepRegistry<[{tokens: ['Given', 'step', '"one"'], text: 'Given step "one"'}]>();
    steps.define('Given step {}', async ({parameters})=>{
      // @ts-expect-error
      const _expectType1: ['"one"'] = parameters;
      const _expectType2: ['one'] = parameters;
    });

    const step = steps.find(parseStep('Given step "one"', dialects.en));
    expect(step.parameters).to.deep.equal(['one']);
  });
  it('allows parameterized step without type checking', () => {
    const steps = new StepRegistry();
    steps.define('Given step {}', async ({parameters})=>{
      // @ts-expect-error
      const _expectType: never = parameters[0];
    });
  });
  it('allows template with multiple choices', () => {
    const steps = new StepRegistry<[{tokens: ['Given', 'one', 'step'], text: 'Given one step'}]>();
    const stepfn = async () => {};
    steps.define('Given {} step/steps', stepfn);
    
    const step = steps.find(parseStep('Given one step', dialects.en));
    expect(step.call).to.deep.equal(stepfn);
    expect(step.parameters).to.deep.equal(['one']);
  });

  it('throws on multiple steps', ()=>{
    const steps = new StepRegistry();
    const stepfn1 = async () =>{}
    const stepfn2 = async () =>{}

    steps.define('Given a {}', stepfn1)
  
    expect(()=>steps.define('Given a "something"', stepfn2)).to.throw('Step already exists');
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