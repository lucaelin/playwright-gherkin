import { parseArgs } from "node:util";
import { generateSpecs, watchFeatures } from './index.js';

const args = parseArgs({
  options: {
    watch: {
      type: "boolean",
      default: false,
    },
  },
  allowPositionals: true,
});

await generateSpecs(args.positionals[0] ?? '**/*.feature');

if(args.values.watch) {
  await watchFeatures(args.positionals[0] ?? '**/*.feature');
}