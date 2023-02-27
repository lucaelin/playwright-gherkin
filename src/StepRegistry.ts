import { PlaywrightTestArgs, PlaywrightTestOptions, PlaywrightWorkerArgs, PlaywrightWorkerOptions, TestInfo } from '@playwright/test';
import { DataTable } from './DataTable.js';

import {Dialect, dialects} from '@cucumber/gherkin';
import { ParsedStep, Step, parseStep } from './parse.js';
import { ExtractTemplateValues, Join, Template, Tokenize } from './utils.js';


export type PlaywrightArgs = PlaywrightTestArgs & PlaywrightTestOptions & PlaywrightWorkerArgs & PlaywrightWorkerOptions;
type DataTableOrUndefined<Table extends string[][] | undefined> = Table extends string[][] ? DataTable<Table> : undefined;
export type GherkinArgs<Declaration extends StepsDeclaration[number] = StepsDeclaration[number], MatchingTemplate extends string[] = string[]> = {
  docString: Declaration['docString'], 
  table: DataTableOrUndefined<Declaration["table"]>, 
  step: Declaration, 
  world: Record<string, any>,
  parameters: ExtractTemplateValues<MatchingTemplate, Declaration['tokens']>,
};
export type PlaywrightTestInfo = TestInfo;


export type StepFunction<Declaration extends StepsDeclaration[number] = StepsDeclaration[number], Step extends string = string> = 
  (args: PlaywrightArgs & GherkinArgs<Declaration, Template<Step>>, info: PlaywrightTestInfo) => Promise<void>;

export type StepsDeclaration = Array<Pick<Step, 'tokens'|'text'|'docString'|'table'>>
type ValidStepOrNever<Step extends string, Steps extends StepsDeclaration> = 
  Extract<Steps[number]['tokens'], Template<Step>> extends never 
    ? never 
    : Step;
type ValidStepDeclarations<Step extends string, Steps extends StepsDeclaration> = 
  StepsDeclaration extends Steps 
    ? Steps[number]
    : Extract<Steps[number], {tokens: Template<Step>}>

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

  find({type, keyword, tokens, text}: ParsedStep): {call: StepFunction<Steps[number], string>, tokens: string[], parameters: string[]} {
    const steps = this.steps[type];
    let definedSteps = [...steps.entries()].filter(([definedTokens])=>definedTokens.length === tokens.length);
    const parameters: string[] = [];

    for (const [index, token] of tokens.entries()) {
      definedSteps = definedSteps.filter(([definedTokens])=>{
        if (definedTokens[index] === '{}') {
          parameters.push(token);
          return true;
        }
        return definedTokens[index]===token
      });
    }

    if (definedSteps.length === 1) return {call: definedSteps[0][1], tokens, parameters};
    if (definedSteps.length >= 1) throw new Error(`Found multiple steps for: ${text}`);
    
    throw new Error(`Unable to find step: ${text}`);
  };

  define<Step extends string>(
    statement: Step & (Steps[number]["text"] | ValidStepOrNever<Step, Steps>), 
    step: StepFunction<ValidStepDeclarations<Step, Steps>, Step>
  ) {
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