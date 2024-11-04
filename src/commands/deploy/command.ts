import { spawn } from "child_process";

export async function runCommand(network: string[]) {
  console.log("Starting deployment...");

  const command = 'npm';
  const args = ['run', 'deploy', '--', '--network', ...network];

  console.log(`Running command: ${command} ${args.join(' ')}`);

  const child = spawn(command, args, { stdio: 'inherit', shell: true });

  return new Promise<void>((resolve, reject) => {
    child.on('close', (code: number) => {
      if (code !== 0) {
        console.error(`Deploy failed with exit code ${code}`);
        reject(new Error(`Deploy failed with exit code ${code}`));
        process.exit(1);
      } else {
        console.log("Deploy successful");
        resolve();
      }
    });

    child.on('error', (err: any) => {
      console.error(`Error spawning command: ${err.message}`);
      reject(err);
      process.exit(1);
    });
  });
}