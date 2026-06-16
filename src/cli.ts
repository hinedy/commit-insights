import { Command } from "commander";

declare const __VERSION__: string;

export function buildProgram(): Command {
  const program = new Command("commit-insights");

  program
    .description("Generate a local git contribution dashboard from commit history")
    .version(__VERSION__);

  return program;
}
