#!/usr/bin/env node

import { DeCentCLI } from "../DeCentCLI.mjs";

const debug = process.argv.slice(2).includes("--d")
await (new DeCentCLI(debug)).run(process.argv.slice(2))
