export class ManifestNotFoundError extends Error {
  readonly actionableMessage: string;

  constructor(path: string) {
    super(`Manifest not found at: ${path}`);
    this.name = 'ManifestNotFoundError';
    this.actionableMessage = `No manifest file found at "${path}". Create an agent-forge.manifest.jsonc file in the repo root.`;
  }
}

export class ManifestParseError extends Error {
  readonly actionableMessage: string;

  constructor(message: string, line?: number) {
    const lineInfo = line !== undefined ? ` at line ${line}` : '';
    super(`Manifest parse error${lineInfo}: ${message}`);
    this.name = 'ManifestParseError';
    this.actionableMessage = `The manifest file has a syntax error${lineInfo}. Fix the JSONC syntax and try again.`;
  }
}

export class ManifestValidationError extends Error {
  readonly actionableMessage: string;

  constructor(message: string) {
    super(`Manifest validation error: ${message}`);
    this.name = 'ManifestValidationError';
    this.actionableMessage = `The manifest file is invalid: ${message}. See the architecture docs for the expected schema.`;
  }
}

export class PathResolutionError extends Error {
  readonly actionableMessage: string;

  constructor(message: string) {
    super(`Path resolution error: ${message}`);
    this.name = 'PathResolutionError';
    this.actionableMessage = `Could not resolve path: ${message}. Check that the required environment variables are set.`;
  }
}

export class FileOperationError extends Error {
  readonly actionableMessage: string;

  constructor(operation: string, filePath: string) {
    super(`File operation error on "${filePath}": ${operation}`);
    this.name = 'FileOperationError';
    this.actionableMessage = `Failed to ${operation} "${filePath}". Check file permissions and that the path exists.`;
  }
}

export class GitOperationError extends Error {
  readonly actionableMessage: string;

  constructor(message: string) {
    super(`Git operation error: ${message}`);
    this.name = 'GitOperationError';
    this.actionableMessage = `Git operation failed: ${message}. Ensure the repo has at least one commit and Git is installed.`;
  }
}
