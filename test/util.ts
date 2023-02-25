import { Spec } from "../src/parse";

type DeepPartial<T> = T extends object ? {
  [key in keyof T]?: DeepPartial<T[key]>;
} : T;

export function defaultSpec(spec: DeepPartial<Spec>): Spec {
  return {
    uri: 'test.feature',
    content: '',
    language: 'en',
    comments: [],
    ...spec,
    features: spec?.features?.map((feat)=>({
      name: 'Feature 1',
      language: 'en',
      keyword: 'Feature',
      description: '',
      tags: [],
      location: {line: 1, column: 0},
      ...feat,
      scenarios: feat?.scenarios?.map((scn)=>({
        name: 'Scenario 1',
        tags: [],
        location: {line: 1, column: 0},
        ...scn,
        steps: scn?.steps?.map((step)=>({
          text: 'Then step 1',
          location: {line: 1, column: 0},
          keyword: 'Then',
          originalKeyword: 'And',
          originalText: 'And step 1',
          expressionText: '',
          type: 'Outcome',
          ...step,
        }))
      }))
    }))
  } as Spec;
}
