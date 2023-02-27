import { PlaywrightTestArgs, PlaywrightTestOptions, PlaywrightWorkerArgs, PlaywrightWorkerOptions, TestInfo } from '@playwright/test';
import { DataTable } from './DataTable.js';

import {Dialect, dialects} from '@cucumber/gherkin';
import { ParsedStep, Step, parseStep } from './parse.js';
import { Join, Template } from './utils.js';


export type PlaywrightArgs = PlaywrightTestArgs & PlaywrightTestOptions & PlaywrightWorkerArgs & PlaywrightWorkerOptions;
type DataTableOrUndefined<Table extends string[][] | undefined> = Table extends string[][] ? DataTable<Table> : undefined;
export type GherkinArgs<Declaration extends StepsDeclaration[number] = StepsDeclaration[number]> = {docString: Declaration['docString'], table: DataTableOrUndefined<Declaration["table"]>, step: Declaration, world: Record<string, any>};
export type PlaywrightTestInfo = TestInfo;

export type StepFunction<Declaration extends StepsDeclaration[number] = StepsDeclaration[number]> = 
  (args: PlaywrightArgs & GherkinArgs<Declaration>, info: PlaywrightTestInfo) => Promise<void>;

export type StepsDeclaration = Array<Pick<Step, 'tokens'|'text'|'docString'|'table'>>
type ValidStepOrNever<T extends string, Steps extends StepsDeclaration> = Extract<Steps[number]['tokens'], Template<T>> extends never ? never : T;
type ValidStepDeclarations<T extends string, Steps extends StepsDeclaration> = Extract<Steps[number], {tokens: Template<T>}>

export class StepRegistry<Steps extends StepsDeclaration = StepsDeclaration> {
  private steps = {
    'Context': new Map<string[], StepFunction>(), 
    'Action': new Map<string[], StepFunction>(), 
    'Outcome': new Map<string[], StepFunction>(), 
    'Conjunction': new Map<string[], StepFunction>(), 
    'Unknown': new Map<string[], StepFunction>(), 
  };
  private dialect: Dialect;

  constructor(dialect: keyof typeof dialects = process.env.npm_package_config_gherkin_dialect || 'en') {
    if (!(dialect in dialects)) throw new Error('Invalid Dialect');
    this.dialect = dialects[dialect];
  }

  find({type, keyword, tokens, text}: ParsedStep): StepFunction<any> {
    const steps = this.steps[type];
    let definedSteps = [...steps.entries()].filter(([definedTokens])=>definedTokens.length === tokens.length);

    for (const [index, token] of tokens.entries()) {
      definedSteps = definedSteps.filter(([definedTokens])=>{
        return definedTokens[index] === '{}' || definedTokens[index]===token
      });
    }

    if (definedSteps.length === 1) return definedSteps[0][1];
    if (definedSteps.length >= 1) throw new Error(`Found multiple steps for: ${text}`);
    
    throw new Error(`Unable to find step: ${text}`);
  };

  define<Step extends string>(statement: Steps[number]["text"] | ValidStepOrNever<Step, Steps>, step: StepFunction<ValidStepDeclarations<Step, Steps>>) {
    const parsed = parseStep(statement, this.dialect);
    if (parsed.type === 'Conjunction') throw new Error('Cannot start a step with a conjunction');

    try {
      this.find(parsed);
    } catch {
      return this.steps[parsed.type].set(parsed.tokens, step as unknown as StepFunction);
    }

    throw new Error('Step already exists');
  };
}