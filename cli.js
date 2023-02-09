#!/usr/bin/env node
"use strict";
const [, , ...args] = process.argv;

import { generateSpecs } from './lib/index.js';
await generateSpecs(args[0] ?? '**/*.feature');