#!/usr/bin/env node
import "dotenv/config";
import { buildProgram } from "../cli.js";

buildProgram().parseAsync(process.argv);
