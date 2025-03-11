import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import semver from 'semver';
import packageJson from '../../package.json';
import logger from './logger';

const execAsync = promisify(exec);
const currentVersion = packageJson.version;

export async function performFullVersionCheck(): Promise<void> {
  const spin = logger.spinner('Checking for updates...');
  
  try {
    const { stdout } = await execAsync(`npm view ${packageJson.name} version`);
    const latestVersion = stdout.trim();
    
    if (semver.gt(latestVersion, currentVersion)) {
      spin.succeed(`Update available: ${currentVersion} → ${latestVersion}`);
      console.log(`
      ${chalk.yellow('Your version:')} ${chalk.dim(currentVersion)}
      ${chalk.green('Latest version:')} ${latestVersion}
      ${chalk.blue('Update with:')} ${chalk.cyan(`npm install -g ${packageJson.name}`)}
      ${chalk.dim('Changelog: ' + packageJson.homepage + '/changelog')}
      `);
    } else {
      spin.succeed(`You're using the latest version (${currentVersion})!`);
    }
  } catch (error) {
    spin.fail('Failed to check for updates');
    logger.error('Error checking for updates: ' + 
      (error instanceof Error ? error.message : String(error)));
    logger.info(`Current version: ${packageJson.version}`);
  }
} 