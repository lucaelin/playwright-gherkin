# playwright-gherkin

Generate Playwright test-runner code from gherkin files!

This project is **WIP**, issues, discussions and contributions are very much
welcome!

## Getting started

1. Install playwright-gherkin: `npm i playwright-gherkin`.

2. Create a gherkin file, preferably in a subfolder: `./my-game/my-game.feature`

```gherkin
Feature: My Game
  Scenario: Loading the game
    When I open the game
    Then the game loads
```

3. Next run `npx playwright-gherkin`. This will generate two files alongside
   your feature.

4. Now you can implement the steps like this: `./my-game/steps.ts`

```typescript
import { StepRegistry } from "playwright-gherkin/lib/StepRegistry.js";

export const steps = new StepRegistry<FeatureSteps[keyof FeatureSteps]>();

steps.define("When I open the game", async ({ page }) => {
  await page.open("example.com");
});

steps.define("Then the game loads", async ({ page }) => {
  await expect(page.locate("canvas")).toBeVisible();
});
```

5. Run your test using `npx playwright test ./my-game/my-game.feature.js` _(note
   the .js extension)_

## Features

- Auto suggests available steps:

```ts
steps.define("", ({ page }) => {});
//           ^?: 'When I open the game' | 'Then the game loads'
```

- Supports and hints parameters:

```ts
steps.define(
  "Then the game {}",
  ({ page, parameters }) => {
    console.log(parameters);
    //              ^?: ['loads']
  },
);
```

- Supports a shared object (world) that can be accessed across all steps within
  a scenario:

```ts
const defaultWorld = { someSharedState: undefined as string | undefined };

export const steps = new StepRegistry<
  FeatureSteps[keyof FeatureSteps],
  typeof defaultWorld // pass a second type argument to get ts support during step definition
>(
  "en",
  defaultWorld,
);

steps.define(
  "Then the game loads",
  ({ page, world }) => {},
  //         ^?: {someSharedState: string | undefined}
);
```

- Supports tables:

```ts
/*
Feature: Tables
  Scenario: Defining tables
    When I define a table
    | Test | Foo | Bar |
    |    1 |   2 |   3 |
*/
export const steps = new StepRegistry<FeatureSteps[keyof FeatureSteps]>();

steps.define(
  "Then the game loads",
  ({ page, table }) => {
    //       ^?: DataTable<[['Test', 'Foo', 'Bar'], ['1', '2', '3']]>
    console.log(table.rowObjects); // {Test: '1', Foo: '2', Bar: '3'}
  },
);
```

## Areas of WIP

- RegEx steps
- stepRegistry.import(other: StepRegistry) / StepRegistry.from(other:
  StepRegistry)
- on-the-fly conversion
- auto prettier / lint-fix
- validate code/gherkin is in sync
- code quality improvements / refactoring
- fixtures
