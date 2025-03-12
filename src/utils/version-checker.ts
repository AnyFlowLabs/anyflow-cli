import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import semver from 'semver';
import fs from 'fs';
import path from 'path';
import os from 'os';
import packageJson from '../../package.json';
import logger from './logger';

const execAsync = promisify(exec);
const currentVersion = packageJson.version;

const configDir = path.join(os.homedir(), '.anyflow');
const versionCacheFile = path.join(configDir, 'version-check.json');

async function shouldCheckForUpdates(): Promise<boolean> {
  try {
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    if (fs.existsSync(versionCacheFile)) {
      const cacheData = JSON.parse(fs.readFileSync(versionCacheFile, 'utf8'));
      const lastCheckTime = new Date(cacheData.lastCheckTime);
      const currentTime = new Date();
      
      const hoursSinceLastCheck = 
        (currentTime.getTime() - lastCheckTime.getTime()) / (1000 * 60 * 60);
      
      return hoursSinceLastCheck >= 24;
    }
    
    return true;
  } catch (error) {
    logger.debug('Error reading version check cache: ' + 
      (error instanceof Error ? error.message : String(error)));
    return true;
  }
}

function updateLastCheckTime(): void {
  try {
    const cacheData = {
      lastCheckTime: new Date().toISOString(),
      version: currentVersion
    };
    
    fs.writeFileSync(versionCacheFile, JSON.stringify(cacheData, null, 2));
  } catch (error) {
    logger.debug('Error updating version check cache: ' + 
      (error instanceof Error ? error.message : String(error)));
  }
}

export async function performFullVersionCheck(): Promise<void> {
  if (!await shouldCheckForUpdates()) {
    return;
  }
  
  const spin = logger.spinner('Checking for updates...');
  
  try {
    const { stdout } = await execAsync(`npm view ${packageJson.name} version`);

    const latestVersion = stdout.trim();
    
    updateLastCheckTime();
    
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
    
    updateLastCheckTime();
  }
} 