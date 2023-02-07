import { PlaywrightTestArgs, PlaywrightTestOptions, PlaywrightWorkerArgs, PlaywrightWorkerOptions, TestInfo } from '@playwright/test';
import { DataTable } from './DataTable';

import {Dialect, dialects} from '@cucumber/gherkin';


type PlaywrightArgs = PlaywrightTestArgs & PlaywrightTestOptions & PlaywrightWorkerArgs & PlaywrightWorkerOptions;
type GherkinArgs = {docString: string, table: DataTable};

type StepFunction = (args: PlaywrightArgs & GherkinArgs, info: TestInfo) => Promise<void>;

type StepType = 'Context' | 'Action' | 'Outcome';

export class StepRegistry {
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
    const {type, text} = this.parse(statement);
    if (this.steps[type].has(text)) throw new Error('Step already exists');
    this.steps[type].set(text, step);
  };
}