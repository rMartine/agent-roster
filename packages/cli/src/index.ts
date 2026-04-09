#!/usr/bin/env node
import { Command } from 'commander';
import { registerDeploy } from './commands/deploy.js';
import { registerRestore } from './commands/restore.js';
import { registerWipe } from './commands/wipe.js';
import { registerStatus } from './commands/status.js';

const program = new Command();

program
  .name('agent-forge')
  .version('0.1.0')
  .description('Manage your AI agent roster')
  .option('--repo <path>', 'Path to the agent-forge repository')
  .option('-y, --yes', 'Skip confirmation prompts');

registerDeploy(program);
registerRestore(program);
registerWipe(program);
registerStatus(program);

program.parse();
