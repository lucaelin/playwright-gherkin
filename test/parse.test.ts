import {expect} from 'chai';
import {parseFeature, Spec, Feature, Scenario} from '../src/parse.js';

describe('parse', ()=>{
  it('parses and empty spec', ()=>{
    const spec = parseFeature('happy_path.feature', ``);

    expect(spec).to.deep.equal({
      uri: 'happy_path.feature', 
      features: [],
      comments: [],
      language: 'en'
    } as Spec);
  });
  it('parses features', ()=>{
    const spec = parseFeature('happy_path.feature', `
      Feature: Development
    `);

    expect(spec.features[0]).to.deep.equal({
      name: 'Development', 
      description: '', 
      keyword: 'Feature',
      language: 'en',
      location: {
        line: 2,
        column: 7,
      },
      scenarios: [],
      tags: [],
    } as Feature);
  });
  it('parses scenarios', ()=>{
    const spec = parseFeature('happy_path.feature', `
      Feature: Development
        Scenario: First Scn
        Scenario: Second Scn
    `);

    expect(spec.features[0].scenarios[0]).to.deep.equal({
      name: 'First Scn',
      location: {
        line: 3,
        column: 9,
      },
      steps: [],
      tags: [],
    } as Scenario);
    expect(spec.features[0].scenarios[1]).to.deep.equal({
      name: 'Second Scn',
      location: {
        line: 4,
        column: 9,
      },
      steps: [],
      tags: [],
    } as Scenario);
  });
  it('parses steps', ()=>{
    const spec = parseFeature('happy_path.feature', `
      Feature: Development
        Scenario: First Scn
          Given a first step
          When taking a second step
          Then you walked three steps
    `);

    expect(spec.features[0].scenarios[0].steps[0]).to.deep.equal({
        docString: undefined,
        expressionText: "a first step",
        expressions: [],
        location: {
          column: 11,
          line: 4
        },
        keyword: 'Given',
        originalKeyword: 'Given',
        originalText: "Given a first step",
        table: undefined,
        text: "a first step",
        type: "Context",
    });
  });
  it('resolves and', ()=>{
    const spec = parseFeature('happy_path.feature', `
      Feature: Development
        Scenario: First Scn
          Given a first step
          And a second step
          When taking a third step
          And taking a fourth step
          Then you walked four steps
          And you are tired
    `);

    expect(spec.features[0].scenarios[0].steps[0].keyword).to.equal('Given');
    expect(spec.features[0].scenarios[0].steps[0].originalKeyword).to.equal('Given');
    expect(spec.features[0].scenarios[0].steps[1].keyword).to.equal('Given');
    expect(spec.features[0].scenarios[0].steps[1].originalKeyword).to.equal('And');
    expect(spec.features[0].scenarios[0].steps[3].keyword).to.equal('When');
    expect(spec.features[0].scenarios[0].steps[3].originalKeyword).to.equal('And');
    expect(spec.features[0].scenarios[0].steps[5].keyword).to.equal('Then');
    expect(spec.features[0].scenarios[0].steps[5].originalKeyword).to.equal('And');
  });

  it('applies tags', ()=>{
    const spec = parseFeature('happy_path.feature', `
      @smoke @team-x
      Feature: Development
        @slow
        Scenario: Testing
          Then it works
    `);

    expect(spec.features[0].tags).to.deep.equal([
      "@smoke",
      "@team-x"
    ]);
    expect(spec.features[0].scenarios[0].tags).to.deep.equal([
      "@smoke",
      "@team-x",
      "@slow"
    ]);
  });


  it('generates a complete spec structure', ()=>{
    const spec = parseFeature('happy_path.feature', `
      Feature: Development
        Scenario: Testing
          Given good software
          When you test it
          Then it works
    `);

    expect(spec).to.deep.equal({
      uri: "happy_path.feature",
      comments: [],
      language: "en",
      features: [
        {
          language: "en",
          description: "",
          tags: [],
          keyword: "Feature",
          name: "Development",
          location: {
            line: 2,
            column: 7
          },
          scenarios: [
            {
              name: "Testing",
              tags: [],
              location: {
                line: 3,
                column: 9
              },
              steps: [
                {
                  location: {
                    line: 4,
                    column: 11
                  },
                  type: "Context",
                  text: "good software",
                  keyword: 'Given',
                  originalKeyword: 'Given',
                  originalText: "Given good software",
                  expressionText: "good software",
                  expressions: [],
                  table: undefined,
                  docString: undefined
                },
                {
                  location: {
                    line: 5,
                    column: 11
                  },
                  type: "Action",
                  text: "you test it",
                  keyword: 'When',
                  originalKeyword: 'When',
                  originalText: "When you test it",
                  expressionText: "you test it",
                  expressions: [],
                  table: undefined,
                  docString: undefined
                },
                {
                  location: {
                    line: 6,
                    column: 11
                  },
                  type: "Outcome",
                  text: "it works",
                  keyword: 'Then',
                  originalKeyword: 'Then',
                  originalText: "Then it works",
                  expressionText: "it works",
                  expressions: [],
                  table: undefined,
                  docString: undefined
                }
              ]
            }
          ]
        }
      ]
    })
  });
}) 