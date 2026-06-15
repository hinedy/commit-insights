#!/usr/bin/env node
import { buildProgram } from "../cli.js";

buildProgram().parseAsync(process.argv);
