import {expect} from 'chai';
import {generateCode} from '../src/generate.js';
import {Parser} from 'acorn';
import {ArrowFunctionExpression, BlockStatement, ImportDeclaration, Literal, ModuleDeclaration, Program, Node} from 'estree';

function nonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

function check<T extends Node['type']>(value: unknown, type: T): Node & {type: T} | undefined {
  if (typeof value === 'object' && (value as {type?: unknown})?.type === type) return value as any;
  return undefined;
}

type Spec = {
  variables: string[];
  describes: Describe[];
}
type Describe = {
  name: string;
  tests: Test[];
}
type Test = {
  name: string;
  steps: Step[];
}
type Step = {
  type: string,
  name: string,
}

function toSteps(ast: ArrowFunctionExpression): Step[] {
  const steps = (ast.body as BlockStatement).body.map(expr=>{
    const stmt = check(expr, 'ExpressionStatement');
    const callR = check(stmt?.expression, 'CallExpression');
    const callL = check(callR?.callee, 'CallExpression');
    const callee = check(callL?.callee, 'MemberExpression');

    const object = check(callee?.object, 'Identifier');

    if (object?.name !== 'steps') return undefined; 
    const arg0 = check(callL?.arguments[0], 'Literal');
    const arg1 = check(callL?.arguments[1], 'Literal');

    if (!arg0 || !arg1) return undefined;
  
    return {
      type: arg0.value as string,
      name: arg1.value as string,
    }
  }).filter(nonNullable)

  return steps
}

function toTests(ast: ArrowFunctionExpression): Test[] {
  const tests = (ast.body as BlockStatement).body.map(expr=>{
    const stmt = check(expr, 'ExpressionStatement');
    const call = check(stmt?.expression, 'CallExpression');
    const callee = check(call?.callee, 'Identifier');

    if (callee?.name !== 'test') return undefined;
    const arg0 = check(call?.arguments[0], 'Literal');
    const arg1 = check(call?.arguments[1], 'ArrowFunctionExpression');

    if (!arg0 || !arg1) return undefined;
  
    return {
      name: arg0.value as string,
      steps: toSteps(arg1),
    }
  }).filter(nonNullable)

  return tests
}

function toSpec(ast: Program): Spec {
  const importDeclarations = (ast.body as ModuleDeclaration[]).filter(n=>n.type==='ImportDeclaration') as ImportDeclaration[];
  const imports = importDeclarations.flatMap(n=>n?.specifiers.map(spec=>spec.local.name));
  
  expect(imports).to.contain('DataTable');

  const describes = ast.body
    .map(expr=>{
      const stmt = check(expr, 'ExpressionStatement');
      const call = check(stmt?.expression, 'CallExpression');
      const callee = check(call?.callee, 'MemberExpression');
      const object = check(callee?.object, 'Identifier');
      const prop = check(callee?.property, 'Identifier');

      if (object?.name !== 'test') return undefined; 
      if (prop?.name !== 'describe') return undefined;
      
      const args = call?.arguments;
      const arg0 = check(args?.[0], 'Literal');
      const arg1 = check(args?.[1], 'ArrowFunctionExpression');

      if (!arg0 || !arg1) return undefined;
      
      return {
        name: arg0.value!.toString(),
        tests: toTests(arg1),
      };
    }).filter(nonNullable)

  return {
    variables: [...imports],
    describes: describes
  }
}

describe('generate', ()=>{
  it('Simple Feature', ()=>{
    const out = generateCode('happy_path.feature', `
      Feature: Development
        Scenario: Testing
          Given good software
          When you test it
          Then it works
    `);
    const ast = Parser.parse(out, {sourceType: 'module', ecmaVersion: 2020}) as unknown as Program;

    const spec = toSpec(ast);
    expect(spec).to.deep.equal({
      variables: ['test', 'DataTable', 'steps'],
      describes: [{
        name: 'Development', 
        tests: [{
          name: "Testing",
          steps: [{
            name: "good software",
            type: "Context",
          },{
            name: "you test it",
            type: "Action",
          },{
            name: "it works",
            type: "Outcome",
          },]
        }]
      }]
    } as Spec)
  });
}) 