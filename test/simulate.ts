import { DataTable } from "../src/DataTable";
import { StepRegistry } from "../src/StepRegistry";
import { ParsedStep } from "../src/parse";

export async function simulate(code: string, implementations: {steps?: StepRegistry, DataTable?: typeof DataTable} = {}) {

  const callhistory: {call: string, [key: string]: any}[] = [];

  async function MockedConfigure(config) {
    callhistory.push({call: 'test.describe.configure', config});
  };
  async function MockedDescribe(name, fn) {
    callhistory.push({call: 'test.describe', name, fn});
    callhistory.at(-1)!.ret = fn();
  }
  MockedDescribe.configure = MockedConfigure
  
  async function MockedTimeout(timeout) {
    callhistory.push({call: 'test.setTimeout', timeout});
  };
  MockedTest.setTimeout = MockedTimeout;
  async function MockedTest(name, fn) {
    callhistory.push({call: 'test', name, fn});
    callhistory.at(-1)!.ret = fn({}, {timeout: 100});
  }
  MockedTest.describe = MockedDescribe;
  
  class MockedRegistry {
    find(step: ParsedStep<string>) {
      callhistory.push({call: 'steps.find', step});
      return {
        call: async (pw, info)=>{
          callhistory.push({call: 'steps.find.call', pw, info});
        },
        parameters: [],
        tokens: step.tokens,
      } satisfies ReturnType<StepRegistry['find']>
    }
    define(name: string, fn) {
      callhistory.push({call: 'steps.define', name, fn});
    }
  }
  class MockedDataTable {
    constructor(table) {
      callhistory.push({call: 'DataTable', table});
    }
  }
  function MockedSetTimeout(fn, timeout) {
    callhistory.push({call: 'setTimeout', fn, timeout});
    return setTimeout(fn, timeout);
  }
  

  const testCode = code.split('\n').filter(l=>!l.startsWith('import ')).join('\n');
  const args = {
    test: MockedTest,
    steps: new MockedRegistry(),
    DataTable: MockedDataTable,
    setTimeout: MockedSetTimeout,
    ...implementations,
  };

  const testFn = new Function(...Object.keys(args), testCode);
  await testFn.call(null, ...Object.values(args));
  await Promise.all(callhistory.map(x=>x.ret));
  return callhistory;
}