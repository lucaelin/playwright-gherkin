import { PlaywrightTestArgs, PlaywrightTestOptions, PlaywrightWorkerArgs, PlaywrightWorkerOptions, TestInfo } from '@playwright/test';
import { DataTable } from './DataTable.js';

import {Dialect, dialects} from '@cucumber/gherkin';
import { PickleStepType } from '@cucumber/messages';
import { ParsedStep, parseStep } from './parse.js';


export type PlaywrightArgs = PlaywrightTestArgs & PlaywrightTestOptions & PlaywrightWorkerArgs & PlaywrightWorkerOptions;
export type GherkinArgs = {docString: string, table: DataTable, expressions: string[], world: Record<string, any>};
export type PlaywrightTestInfo = TestInfo;

export type StepFunction = (args: PlaywrightArgs & GherkinArgs, info: PlaywrightTestInfo) => Promise<void>;



export class StepRegistry<StepList extends string[] = string[]> {
  private previouslyDefinedType?: string;
  private steps = {
    'Context': new Map<string, StepFunction>(), 
    'Action': new Map<string, StepFunction>(), 
    'Outcome': new Map<string, StepFunction>(), 
    'Conjunction': new Map<string, StepFunction>(), 
  };
  private dialect: Dialect;

  constructor(dialect: keyof typeof dialects = process.env.npm_package_config_gherkin_dialect || 'en') {
    if (!(dialect in dialects)) throw new Error('Invalid Dialect');
    this.dialect = dialects[dialect];
  }

  find({type, keyword, expressionText, text}: ParsedStep): StepFunction {
    const steps = this.steps[type];
    if (steps.has(text)) return steps.get(text)!;
    if (expressionText && steps.has(expressionText)) return steps.get(expressionText)!;
    throw new Error(`Unable to find step: ${keyword} ${text}`);
  };

  define(statement: StepList[number], step: StepFunction) {
    const {type: rawType, text} = parseStep(statement, this.dialect);
    const type = rawType === 'Conjunction' ? this.previouslyDefinedType : rawType;
    this.previouslyDefinedType = type;
    if (!type) throw new Error('Cannot start a registry with a conjunction');
    
    if (this.steps[type].has(text)) throw new Error('Step already exists');
    this.steps[type].set(text, step);
  };
}