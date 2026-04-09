import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { handleDeploy, handleRestore, handleWipe, handleStatus, resolveRepoPath } from './commands';
import { RosterTreeViewProvider } from './rosterTreeView';
import { scaffoldRepo, detectHardware, selectImageModel } from '@agent-forge/core';

let outputChannel: vscode.OutputChannel;

function getConfiguredRepoPath(): string | undefined {
  return vscode.workspace.getConfiguration('agentForge').get<string>('repoPath') || undefined;
}

function updateRepoContext(): void {
  const repoPath = getConfiguredRepoPath();
  vscode.commands.executeCommand('setContext', 'agentForge.repoConfigured', !!repoPath);
}

export function activate(context: vscode.ExtensionContext): void {
  outputChannel = vscode.window.createOutputChannel('Agent Forge');

  const provider = new RosterTreeViewProvider(() => getConfiguredRepoPath());

  updateRepoContext();

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('agentForge.roster', provider),

    vscode.commands.registerCommand('agentForge.deploy', async () => {
      await handleDeploy(outputChannel);
      provider.refresh();
    }),
    vscode.commands.registerCommand('agentForge.restore', async () => {
      await handleRestore(outputChannel);
      provider.refresh();
    }),
    vscode.commands.registerCommand('agentForge.wipe', async () => {
      await handleWipe(outputChannel);
      provider.refresh();
    }),
    vscode.commands.registerCommand('agentForge.status', () => handleStatus(outputChannel)),

    vscode.commands.registerCommand('agentForge.refresh', () => {
      provider.refresh();
    }),

    vscode.commands.registerCommand('agentForge.setRepoPath', async () => {
      const current = getConfiguredRepoPath();
      const uris = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select Agent Forge Repository',
        defaultUri: current ? vscode.Uri.file(current) : undefined,
      });
      if (uris && uris.length > 0) {
        const selectedPath = uris[0].fsPath;
        await vscode.workspace
          .getConfiguration('agentForge')
          .update('repoPath', selectedPath, vscode.ConfigurationTarget.Global);
        updateRepoContext();
        provider.refresh();

        const manifestPath = path.join(selectedPath, 'agent-forge.manifest.jsonc');
        if (!fs.existsSync(manifestPath)) {
          const scaffold = await vscode.window.showInformationMessage(
            'This folder doesn\'t contain an Agent Forge manifest. Create the folder structure?',
            'Yes', 'No',
          );
          if (scaffold === 'Yes') {
            try {
              const result = await scaffoldRepo(selectedPath);
              vscode.window.showInformationMessage(
                `Agent Forge: Created ${result.created.length} items. Folder structure ready.`,
              );
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              vscode.window.showErrorMessage(`Agent Forge: Scaffold failed — ${msg}`);
            }
          }
        }
      }
    }),

    vscode.commands.registerCommand('agentForge.openFile', (item: { fileStatus?: { path: string } }) => {
      const repoPath = getConfiguredRepoPath();
      if (item?.fileStatus?.path && repoPath) {
        const fullPath = path.join(repoPath, item.fileStatus.path);
        const uri = vscode.Uri.file(fullPath);
        vscode.workspace.openTextDocument(uri).then((doc) => vscode.window.showTextDocument(doc));
      }
    }),

    vscode.commands.registerCommand('agentForge.enableSubAgents', async () => {
      await vscode.workspace
        .getConfiguration('chat.subagents')
        .update('allowInvocationsFromSubagents', true, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage('Agent Forge: Sub-agent nesting enabled.');
    }),

    vscode.commands.registerCommand('agentForge.selectImageModel', () =>
      runImageModelSelection(outputChannel),
    ),

    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('agentForge.repoPath')) {
        updateRepoContext();
        provider.refresh();
      }
    }),

    outputChannel,
  );

  // Ollama prerequisite check
  const ollamaDismissed = context.globalState.get<boolean>('ollamaPromptDismissed');
  if (!ollamaDismissed) {
    const cp = await import('node:child_process');
    try {
      cp.execFileSync('ollama', ['--version'], { stdio: 'ignore' });
    } catch {
      vscode.window
        .showWarningMessage(
          'Agent Forge: Ollama is not installed. Image generation features require Ollama.',
          'Download Ollama',
          'Dismiss',
        )
        .then((choice) => {
          if (choice === 'Download Ollama') {
            vscode.env.openExternal(vscode.Uri.parse('https://ollama.com/download'));
          } else if (choice === 'Dismiss') {
            context.globalState.update('ollamaPromptDismissed', true);
          }
        });
    }
  }

  // Auto-select image model if graphic-designer.agent.md still has placeholder
  const repoPath = getConfiguredRepoPath();
  if (repoPath) {
    const agentFile = path.join(repoPath, 'agents', 'graphic-designer.agent.md');
    if (fs.existsSync(agentFile)) {
      const content = fs.readFileSync(agentFile, 'utf-8');
      if (content.includes('{{IMAGE_MODEL}}')) {
        runImageModelSelection(outputChannel).catch(() => {
          // Silently ignore — user can run manually from palette
        });
      }
    }
  }

  // Sub-agent nesting opt-in prompt
  const subAgentSetting = vscode.workspace
    .getConfiguration('chat.subagents')
    .get<boolean>('allowInvocationsFromSubagents');
  if (!subAgentSetting) {
    const dismissed = context.globalState.get<boolean>('subAgentPromptDismissed');
    if (!dismissed) {
      vscode.window
        .showInformationMessage(
          'Agent Forge works best with sub-agent nesting enabled. Enable it?',
          'Yes',
          'Not Now',
        )
        .then((choice) => {
          if (choice === 'Yes') {
            vscode.workspace
              .getConfiguration('chat.subagents')
              .update('allowInvocationsFromSubagents', true, vscode.ConfigurationTarget.Global);
          } else if (choice === 'Not Now') {
            context.globalState.update('subAgentPromptDismissed', true);
          }
        });
    }
  }
}

async function runImageModelSelection(output: vscode.OutputChannel): Promise<void> {
  const repoPath = getConfiguredRepoPath();
  if (!repoPath) {
    vscode.window.showWarningMessage('Agent Forge: Set a repository path first.');
    return;
  }

  const agentFile = path.join(repoPath, 'agents', 'graphic-designer.agent.md');
  if (!fs.existsSync(agentFile)) {
    vscode.window.showWarningMessage('Agent Forge: graphic-designer.agent.md not found in repo.');
    return;
  }

  output.appendLine('[Image Model] Detecting hardware…');
  const hw = detectHardware();
  output.appendLine(`[Image Model] GPU: ${hw.gpu ?? 'none'}, VRAM: ${hw.vramMB} MB, RAM: ${hw.ramMB} MB`);

  const { model, description } = selectImageModel(hw.vramMB);
  output.appendLine(`[Image Model] Selected: ${model} — ${description}`);

  // Pull via Ollama
  const cp = await import('node:child_process');
  try {
    cp.execFileSync('ollama', ['--version'], { stdio: 'ignore' });
  } catch {
    vscode.window.showErrorMessage('Agent Forge: Ollama is not installed. Cannot pull image model.');
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Agent Forge: Downloading image model '${model}'…`,
      cancellable: false,
    },
    () =>
      new Promise<void>((resolve, reject) => {
        cp.execFile('ollama', ['pull', model], { timeout: 600_000 }, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      }),
  ).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`Agent Forge: Failed to pull model '${model}' — ${msg}`);
    throw err;
  });

  // Write model name into agent file
  const content = fs.readFileSync(agentFile, 'utf-8');
  const updated = content.replaceAll('{{IMAGE_MODEL}}', model);
  fs.writeFileSync(agentFile, updated, 'utf-8');

  output.appendLine(`[Image Model] Wrote model '${model}' to graphic-designer.agent.md`);
  vscode.window.showInformationMessage(`Agent Forge: Image model set to '${model}'.`);
}

export function deactivate(): void {
  // No cleanup needed
}
