import type { Command } from 'commander';
import { deploy } from '@agent-forge/core';

export function registerDeploy(program: Command): void {
  program
    .command('deploy')
    .description('Deploy roster files to their target locations')
    .action(async () => {
      const opts = program.opts();
      const repoPath = opts.repo || process.cwd();

      try {
        const result = await deploy(repoPath);

        console.log('\nDeploy Results:');
        console.log(`  Deployed: ${result.deployed}`);
        console.log(`  Skipped:  ${result.skipped}`);
        console.log(`  Failed:   ${result.failed}`);

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
