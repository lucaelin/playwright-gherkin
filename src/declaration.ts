import { Spec } from "./parse";

export function generateDeclaration(spec: Spec) {
  const steps = spec.features.flatMap(f=>f.scenarios).flatMap(s=>s.steps);
  return [
    `export type Steps = ${JSON.stringify(steps, null, 4)}`,
    `declare module './steps' {`,
    `    export interface FeatureSteps {`,
    `        ${JSON.stringify(spec.uri)}: Steps;`,
    `    }`,
    `}`,
  ].join('\n')
}