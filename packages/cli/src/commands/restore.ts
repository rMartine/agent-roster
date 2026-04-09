import * as readline from 'node:readline';
import type { Command } from 'commander';
import { restore } from '@agent-forge/core';

function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(`${message} [y/N] `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

export function registerRestore(program: Command): void {
  program
    .command('restore')
    .description('Restore target files from last committed versions')
    .action(async () => {
      const opts = program.opts();
      const repoPath = opts.repo || process.cwd();

      if (!opts.yes) {
        const ok = await confirm('This will overwrite local files with committed versions. Continue?');
        if (!ok) {
          console.log('Aborted.');
          return;
        }
      }

      try {
        const result = await restore(repoPath);

        console.log('\nRestore Results:');
        console.log(`  Restored:         ${result.restored}`);
        console.log(`  Recreated:        ${result.recreated}`);
        console.log(`  Already matching: ${result.alreadyMatching}`);

        if (result.details.length > 0) {
          console.log('\nDetails:');
          for (const detail of result.details) {
            console.log(`  [${detail.action}] ${detail.path}`);
          }
        }

        if (result.errors.length > 0) {
          console.log('\nErrors:');
          for (const error of result.errors) {
            console.error(`  ${error.path}: ${error.message}`);
          }
        }

        process.exit(result.success ? 0 : 1);
      } catch (err: unknown) {
        const e = err as Error & { actionableMessage?: string };
        console.error(`Error: ${e.actionableMessage ?? e.message}`);
        process.exit(1);
      }
    });
}
