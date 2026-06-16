import { Command } from "commander";

declare const __VERSION__: string;
const VERSION: string =
  typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0-dev";

export function buildProgram(): Command {
  const program = new Command("commit-insights");

  program
    .description("Generate a local git contribution dashboard from commit history")
    .version(VERSION);

  return program;
}
