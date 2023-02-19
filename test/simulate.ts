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
  
  async function MockedTest(name, fn) {
    callhistory.push({call: 'test', name, fn});
    callhistory.at(-1)!.ret = fn({}, {});
  }
  MockedTest.describe = MockedDescribe;
  
  class MockedRegistry {
    find(step: ParsedStep) {
      callhistory.push({call: 'steps.find', step});
      return (pw, info)=>{
        callhistory.push({call: 'steps.find.call', pw, info});
      }
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
  

  const testCode = code.split('\n').filter(l=>!l.startsWith('import ')).join('\n');
  const args = {
    test: MockedTest,
    steps: new MockedRegistry(),
    DataTable: MockedDataTable,
    ...implementations,
  };

  const testFn = new Function(...Object.keys(args), testCode);
  await testFn.call(null, ...Object.values(args));
  await Promise.all(callhistory.map(x=>x.ret));
  return callhistory;
}