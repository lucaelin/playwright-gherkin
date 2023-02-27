import {expect} from 'chai';
import {generateDeclaration} from '../src/declaration.js';
import { defaultSpec } from './util.js';

import {parse} from '@typescript-eslint/parser';

describe('declaration', ()=>{
  it('exports Steps', async ()=>{
    const spec = defaultSpec({
      uri: 'test.feature',
      features: [{
        scenarios: [{
          name: 'Scenario 1',
          steps: [{
            text: 'When Step 1',
            tokens: ['When','Step','1'],
          },{
            text: 'Then Step 2',
            tokens: ['Then','Step','2'],
          }]
        }]
      }]
    }); 

    const declaration = generateDeclaration(spec);
    const ast = parse(declaration) as any;

    const exportTypeSteps = ast.body.find(node=>
      node.type === 'ExportNamedDeclaration' 
      && node.declaration.type === 'TSTypeAliasDeclaration'
      && node.declaration.id.name === 'Steps'
    );
    expect(exportTypeSteps).to.exist;

    const exportTypeStepsMemberTokens = exportTypeSteps.declaration.typeAnnotation.elementTypes.map(e=>e.members.find(m=>m.key.value==='tokens'));
    expect(exportTypeStepsMemberTokens.length).to.be.greaterThan(1);
    
    const exportTypeStepsMemberTokensValues = exportTypeStepsMemberTokens.map(m=>m.typeAnnotation.typeAnnotation.elementTypes.map(e=>e.literal.value));
  
    expect(exportTypeStepsMemberTokensValues).to.deep.equal([ [ 'When', 'Step', '1' ], [ 'Then', 'Step', '2' ] ]);
  });
  it('declares modules steps', async ()=>{
    const spec = defaultSpec({
      uri: 'test.feature',
      features: [{
        scenarios: [{
          name: 'Scenario 1',
          steps: [{
            text: 'When Step 1',
            tokens: ['When','Step','1'],
          },{
            text: 'Then Step 2',
            tokens: ['Then','Step','2'],
          }]
        }]
      }]
    }); 

    const declaration = generateDeclaration(spec);
    const ast = parse(declaration) as any;

    const declareModuleSteps = ast.body.find(node=>
      node.type === 'TSModuleDeclaration' 
      && node.declare === true
      && node.kind === 'module'
      && node.id.value === './steps'
    );
    expect(declareModuleSteps).to.exist;
    
    const declareModuleStepsInterfaceFeatureSteps = declareModuleSteps.body.body.find(node=>
      node.type === 'ExportNamedDeclaration'
      && node.declaration.type === 'TSInterfaceDeclaration'
      && node.declaration.id.name === 'FeatureSteps'
    );
    expect(declareModuleStepsInterfaceFeatureSteps).to.exist;
    
    const declareModuleStepsInterfaceFeatureStepsEntry = declareModuleStepsInterfaceFeatureSteps.declaration.body.body[0];
    expect(declareModuleStepsInterfaceFeatureStepsEntry.key.value).to.equal('test.feature');
    expect(declareModuleStepsInterfaceFeatureStepsEntry.typeAnnotation.typeAnnotation.typeName.name).to.equal('Steps');
  })
}) 