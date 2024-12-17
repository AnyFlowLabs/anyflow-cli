import { spawn } from 'child_process';

type CommandReturnType = {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/**
 * Run a command.
 * Will return the exit code, stdout and stderr of the command
 * independently of the result.
 * The caller should check the exit code to determine if the command
 * was successful or not.
 */
export async function runCommand(command: string, args: string[]): Promise<CommandReturnType> {
  let child;
  try {
    child = spawn(command, args, { shell: true });
  } catch (err: unknown) {
    return Promise.resolve({
      exitCode: 1,
      stderr: err instanceof Error ? err.message : String(err),
      stdout: '',
    });
  }

  child.on('error', (err: unknown) => {
    return Promise.resolve({
      exitCode: 1,
      stderr: err instanceof Error ? err.message : String(err),
      stdout: '',
    });
  });

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';

    console.log('Output:');
    child.stdout.on('data', (data: Buffer) => {
      console.log(data.toString());
      stdout += data.toString();
    });

    child.stderr.on('data', (data: Buffer) => {
      console.error(data.toString());
      stderr += data.toString();
    });

    child.on('close', (code: number) => {
      resolve({
        exitCode: code,
        stderr,
        stdout,
      });
    });
  });
}