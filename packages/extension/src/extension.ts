import * as vscode from 'vscode';
import { handleDeploy, handleRestore, handleWipe, handleStatus } from './commands';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
  outputChannel = vscode.window.createOutputChannel('Agent Forge');

  context.subscriptions.push(
    vscode.commands.registerCommand('agentForge.deploy', () => handleDeploy(outputChannel)),
    vscode.commands.registerCommand('agentForge.restore', () => handleRestore(outputChannel)),
    vscode.commands.registerCommand('agentForge.wipe', () => handleWipe(outputChannel)),
    vscode.commands.registerCommand('agentForge.status', () => handleStatus(outputChannel)),
    outputChannel,
  );
}

export function deactivate(): void {
  // No cleanup needed
}
