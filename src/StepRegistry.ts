import { PlaywrightTestArgs, PlaywrightTestOptions, PlaywrightWorkerArgs, PlaywrightWorkerOptions, TestInfo } from '@playwright/test';
import { DataTable } from './DataTable.js';

import {Dialect, dialects} from '@cucumber/gherkin';


type PlaywrightArgs = PlaywrightTestArgs & PlaywrightTestOptions & PlaywrightWorkerArgs & PlaywrightWorkerOptions;
type GherkinArgs = {docString: string, table: DataTable};

type StepFunction = (args: PlaywrightArgs & GherkinArgs, info: TestInfo) => Promise<void>;

type StepType = 'Context' | 'Action' | 'Outcome' | 'Conjunction';

export class StepRegistry {
  private previouslyDefinedType?: string;
  private steps = {
    'Context': new Map<string, StepFunction>(), 
    'Action': new Map<string, StepFunction>(), 
    'Outcome': new Map<string, StepFunction>(), 
  };
  private dialect: Dialect;

  constructor(dialect: keyof typeof dialects = process.env.npm_package_config_gherkin_dialect || 'en') {
    if (!(dialect in dialects)) throw new Error('Invalid Dialect');
    this.dialect = dialects[dialect];
  }

  private parse(text: string): {type: StepType, prefix: string, text: string} {
    const andPrefix = this.dialect.and.find(prefix=>text.startsWith(prefix));
    if (andPrefix) return {type: 'Conjunction', prefix: andPrefix, text: text.slice(andPrefix.length)};

    const givenPrefix = this.dialect.given.find(prefix=>text.startsWith(prefix));
    if (givenPrefix) return {type: 'Context', prefix: givenPrefix, text: text.slice(givenPrefix.length)};

    const whenPrefix = this.dialect.when.find(prefix=>text.startsWith(prefix));
    if (whenPrefix) return {type: 'Action', prefix: whenPrefix, text: text.slice(whenPrefix.length)};

    const thenPrefix = this.dialect.then.find(prefix=>text.startsWith(prefix));
    if (thenPrefix) return {type: 'Outcome', prefix: thenPrefix, text: text.slice(thenPrefix.length)};

    throw new Error('Unable to parse: '+text);
  }

  find(type: StepType, text: string) {
    const steps = this.steps[type];
    if (steps.has(text)) return steps.get(text);
    throw new Error('Unable to find "'+type+'": '+text)
  };

  define(statement: string, step: StepFunction) {
    const {type: rawType, text} = this.parse(statement);
    const type = rawType === 'Conjunction' ? this.previouslyDefinedType : rawType;
    this.previouslyDefinedType = type;
    if (!type) throw new Error('Cannot start a registry with a conjunction');
    
    if (this.steps[type].has(text)) throw new Error('Step already exists');
    this.steps[type].set(text, step);
  };
}