# playwright-gherkin

Generate Playwright test-runner code from gherkin files!

This project is currently **WIP**, and does not follow semver _yet_ (breaking
changes might occur in any release) - so be warned!

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

## Areas of WIP

- RegEx steps
- stepRegistry.import(other: StepRegistry) / StepRegistry.from(other:
  StepRegistry)
- on-the-fly conversion
- auto prettier / lint-fix
- validate code/gherkin is in sync
- code quality improvements / refactoring
- fixtures
