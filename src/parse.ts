import Gherkin, { Dialect } from '@cucumber/gherkin';
import {IdGenerator, Pickle, StepKeywordType} from '@cucumber/messages';  
import {dialects} from '@cucumber/gherkin';

const uuidFn = IdGenerator.uuid();
const builder = new Gherkin.AstBuilder(uuidFn);
const matcher = new Gherkin.GherkinClassicTokenMatcher();
const parser = new Gherkin.Parser(builder, matcher);

type StepKeywordTypeMap = { [key in StepKeywordType]: `${key}` };
type StepType = StepKeywordTypeMap[keyof StepKeywordTypeMap];

const stepTypeToDialectKey = (type: StepType, dialect: Dialect = dialects.en)=>{
  const dialectKey = ({
    'Context': 'given',
    'Action': 'when',
    'Outcome': 'then',
    'Conjunction': 'and',
    'Unknown': 'unknown',
  } as const)[type];
  return dialect[dialectKey].find((k: string)=>k!=='* ').trim();
}

type Location = {
  line: number,
  column?: number,
}

export type Spec = {
  uri: string,
  content: string,
  language: string,
  comments: string[],
  features: Feature[],
};
export type Feature = {
  keyword: string,
  name: string,
  language: string,
  tags: string[],
  description: string,
  location?: Location,
  scenarios: Scenario[],
};
export type Scenario = {
  name: string,
  tags: string[],
  location?: Location,
  steps: Step[],
};
export type Step = {
  location?: Location,
  type: StepType,
  text: string,
  keyword: string,
  originalKeyword: string,
  originalText: string,
  expressionText: string,
  expressions: string[],
  table?: string[][],
  docString?: string,
};

export function parseFeature(uri: string, feature: string): Spec {
  const document = parser.parse(feature);
  const pickles = Gherkin.compile(document, uri, uuidFn) as Pickle[];
  const dialect = dialects[document.feature?.language ?? 'en'];
  
  return {
    uri,
    content: feature,
    comments: document.comments.map(c=>c.text),
    language: document.feature?.language ?? 'en',
    features: document.feature ? [{
      language: document.feature.language ?? 'en',
      description: document.feature?.description,
      tags: document.feature.tags.map(t=>t.name),
      keyword: document.feature.keyword,
      name: document.feature.name,
      location: document.feature.location,
      scenarios: pickles.map(pickle=>{
        const astNode = document.feature?.children
          .map(child=>child.scenario)
          .find(scn=>pickle.astNodeIds.includes(scn?.id ?? ''));

        const scenariosWithSameName = pickles.filter(p=>p.name === pickle.name);
        const scenarioIndex = scenariosWithSameName.indexOf(pickle);
        const outlineSuffix = scenariosWithSameName.length > 1 ? ` (Example ${scenarioIndex + 1})` : '';

        return {
          name: pickle.name + outlineSuffix, 
          tags: pickle.tags.map(t=>t.name),
          location: astNode?.location,

          steps: pickle.steps.map(step=>{
            const astNode = document.feature?.children
              .flatMap(c=>[...c.background?.steps ?? [], ...c.scenario?.steps ?? []])
              .find(s=>step.astNodeIds.includes(s?.id??''))
            const originalKeyword = astNode?.keyword.trim() ?? '';
            const keyword = stepTypeToDialectKey(step.type ?? 'Unknown', dialect);
            const originalText = `${originalKeyword} ${astNode?.text.trim()}`;
            const {expressionText, expressions} = parameterize({type: step.type ?? 'Unknown', text: step.text, keyword});

            return {
              location: astNode?.location,
              type: step.type ?? 'Unknown',
              text: keyword + ' ' + step.text,
              keyword,
              originalKeyword,
              originalText,
              expressionText,
              expressions,
              table: step.argument?.dataTable?.rows.map(row=>row.cells.map(cell=>cell.value)),
              docString: step.argument?.docString?.content,
            } as Step;
          })
        } as Scenario;
      })
    } as Feature] : []
  } as Spec; 
}

export type ParsedStep = { type: StepType, keyword: string, text: string, expressionText?: string, expressions?: string[]};
export function parseStep(text: string, dialect: Dialect): ParsedStep {
  const andKeyword = dialect.and.find(keyword=>text.startsWith(keyword))?.trim();
  if (andKeyword) return parameterize({type: 'Conjunction', keyword: andKeyword, text: text.slice(andKeyword.length).trim()});

  const givenKeyword = dialect.given.find(keyword=>text.startsWith(keyword))?.trim();
  if (givenKeyword) return parameterize({type: 'Context', keyword: givenKeyword, text: text.slice(givenKeyword.length).trim()});

  const whenKeyword = dialect.when.find(keyword=>text.startsWith(keyword))?.trim();
  if (whenKeyword) return parameterize({type: 'Action', keyword: whenKeyword, text: text.slice(whenKeyword.length).trim()});

  const thenKeyword = dialect.then.find(keyword=>text.startsWith(keyword))?.trim();
  if (thenKeyword) return parameterize({type: 'Outcome', keyword: thenKeyword, text: text.slice(thenKeyword.length).trim()});

  throw new Error('Unable to parse: '+text);
}

export function parameterize(step: ParsedStep): Required<ParsedStep> {
  const matchQuoted = /("([^"]+)"|'([^']+)')/g;
  const expressions = [...step.text.matchAll(matchQuoted)].map(([,,groupDouble,groupSingle])=>groupDouble??groupSingle);

  const expressionText = expressions.reduce((p,c)=>p.replace(c, '{}'), step.text);
  return {...step, expressionText, expressions};
}