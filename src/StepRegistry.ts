import { PlaywrightTestArgs, PlaywrightTestOptions, PlaywrightWorkerArgs, PlaywrightWorkerOptions, TestInfo } from '@playwright/test';
import { DataTable } from './DataTable.js';

import {Dialect, dialects} from '@cucumber/gherkin';


type PlaywrightArgs = PlaywrightTestArgs & PlaywrightTestOptions & PlaywrightWorkerArgs & PlaywrightWorkerOptions;
type GherkinArgs = {docString: string, table: DataTable};

type StepFunction = (args: PlaywrightArgs & GherkinArgs, info: TestInfo) => Promise<void>;
type ParameterizedStep = {originalText: string, escapedText: string, values: string[]}

type StepType = 'Context' | 'Action' | 'Outcome' | 'Conjunction';

export function parse(text: string, dialect: Dialect): {type: StepType, prefix: string, text: string} {
  const andPrefix = dialect.and.find(prefix=>text.startsWith(prefix));
  if (andPrefix) return {type: 'Conjunction', prefix: andPrefix, text: text.slice(andPrefix.length)};

  const givenPrefix = dialect.given.find(prefix=>text.startsWith(prefix));
  if (givenPrefix) return {type: 'Context', prefix: givenPrefix, text: text.slice(givenPrefix.length)};

  const whenPrefix = dialect.when.find(prefix=>text.startsWith(prefix));
  if (whenPrefix) return {type: 'Action', prefix: whenPrefix, text: text.slice(whenPrefix.length)};

  const thenPrefix = dialect.then.find(prefix=>text.startsWith(prefix));
  if (thenPrefix) return {type: 'Outcome', prefix: thenPrefix, text: text.slice(thenPrefix.length)};

  throw new Error('Unable to parse: '+text);
}

export function parameterize(originalText: string): ParameterizedStep {
  const matchQuoted = /("([^"]+)"|'([^']+)')/g;
  const values = [...originalText.matchAll(matchQuoted)].map(([,,groupDouble,groupSingle])=>groupDouble??groupSingle);

  const escapedText = values.reduce((p,c)=>p.replace(c, '*'), originalText);
  return {originalText, escapedText, values};
}

export class StepRegistry {
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

  find(type: StepType, text: string): StepFunction {
    const steps = this.steps[type];
    const params = parameterize(text);
    if (steps.has(params.originalText)) return steps.get(params.originalText)!;
    if (steps.has(params.escapedText)) return steps.get(params.escapedText)!;
    throw new Error('Unable to find "'+type+'": '+text)
  };

  define(statement: string, step: StepFunction) {
    const {type: rawType, text} = parse(statement, this.dialect);
    const type = rawType === 'Conjunction' ? this.previouslyDefinedType : rawType;
    this.previouslyDefinedType = type;
    if (!type) throw new Error('Cannot start a registry with a conjunction');
    
    if (this.steps[type].has(text)) throw new Error('Step already exists');
    this.steps[type].set(text, step);
  };
}