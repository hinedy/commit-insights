import { Command } from "commander";

export function buildProgram(): Command {
  const program = new Command("commit-insights");

  program
    .description("Generate a local git contribution dashboard from commit history")
    .version("0.1.0");

  return program;
}
