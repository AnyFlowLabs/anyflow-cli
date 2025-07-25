import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import { execSync } from 'child_process';
import logger from '../utils/logger';
import { getProjectRoot } from '../utils/getProjectRoot';

import packageJson from '../../package.json';
import { EXIT_CODE_GENERIC_ERROR } from '../utils/exitCodes';

const name = packageJson.name;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

export type HardhatConf = {
  path: string,
  type: string
}

async function installAnyflowSdk(projectPath: string): Promise<void> {
  try {
    logger.info('Installing anyflow-sdk package...');

    // Detect the package manager being used in the project
    let packageManager = 'npm';
    try {
      // Check if yarn.lock exists
      await fs.access(path.join(projectPath, 'yarn.lock'));
      packageManager = 'yarn';
    } catch (e) {
      try {
        // Check if pnpm-lock.yaml exists
        await fs.access(path.join(projectPath, 'pnpm-lock.yaml'));
        packageManager = 'pnpm';
      } catch (e) {
        // Default to npm
      }
    }

    // Install the package with the appropriate package manager
    const installCmd = {
      'npm': 'npm install --save-dev anyflow-sdk',
      'yarn': 'yarn add --dev anyflow-sdk',
      'pnpm': 'pnpm add --save-dev anyflow-sdk'
    }[packageManager] as string;

    execSync(installCmd, {
      cwd: projectPath,
      stdio: 'inherit'
    });

    logger.success(`Successfully installed anyflow-sdk package using ${packageManager}`);
  } catch (error) {
    logger.error('Error installing anyflow-sdk package:', error instanceof Error ? error : undefined);
    throw error;
  }
}

export async function install() {
  logger.info('Setting up Anyflow...');

  // Find the hardhat.config.ts file
  let hardhatConfig: HardhatConf = await findHardhatConfig();

  if (hardhatConfig.path.length < 1) {
    hardhatConfig = await promptForConfigPath();
  }

  if (!hardhatConfig || !hardhatConfig.path) {
    logger.error('Could not locate hardhat.config.ts(js) file. Installation aborted.');
    return;
  }

  // Install anyflow-sdk package
  const projectDir = path.dirname(hardhatConfig.path);
  await installAnyflowSdk(projectDir);

  // Read the existing config file
  let configContent = await fs.readFile(hardhatConfig.path, 'utf-8');

  // Modify the config content
  configContent = updateHardhatConfig(configContent, hardhatConfig.type);

  // Write the updated config back to the file
  await fs.writeFile(hardhatConfig.path, configContent, 'utf-8');

  logger.success('Successfully updated hardhat.config.ts');
  logger.info('You can now use Anyflow in your project!');
}

export async function findHardhatConfig(dir = process.cwd()): Promise<HardhatConf> {
  const files = await fs.readdir(dir);
  const configFile = files.find(file => file === 'hardhat.config.ts' || file === 'hardhat.config.js');

  if (configFile) {
    const type = configFile.endsWith('.ts') ? 'ts' : 'js';
    return { path: path.join(dir, configFile), type };
  }

  const parentDir = path.dirname(dir);

  if (parentDir === dir) {
    logger.warn('Could not find hardhat.config.ts(js) file automatically.');
    return { path: '', type: 'js' };
  }

  return findHardhatConfig(parentDir);
}

export async function promptForConfigPath(): Promise<HardhatConf> {
  return new Promise(async (resolve) => {
    rl.question('Please enter the path to your hardhat.config.ts(js) file: ', async (answer) => {
      const dir = await getProjectRoot();

      if (!dir) {
        logger.error('Could not find project root directory.');

        rl.close();

        process.exit(EXIT_CODE_GENERIC_ERROR);
      }

      let fullPath = path.resolve(dir, answer);

      let extension;

      if (!fullPath.includes('hardhat.config.ts') && !fullPath.includes('hardhat.config.js')) {
        extension = await new Promise<string>((resolveExt) => {
          rl.question('Path does not contain hardhat.config.ts(js). Please enter the file extension (ts or js): ', resolveExt);
        });

        fullPath = path.resolve(fullPath, `hardhat.config.${extension}`);
      } else {
        extension = fullPath.includes('hardhat.config.ts') ? 'ts' : 'js';
      }

      try {
        const stats = await fs.stat(fullPath);

        if (stats.isFile()) {
          rl.close();

          resolve({ path: fullPath, type: extension });
        } else {
          logger.error('The specified path is not a file.');
          rl.close();

          resolve({ path: '', type: '' });
        }
      } catch (error) {
        logger.error('The specified file does not exist or is not accessible.', error instanceof Error ? error : undefined);

        rl.close();

        resolve({ path: '', type: '' });
      }
    });
  });
}

function updateHardhatConfig(content: string, type: string): string {
  // Check if anyflow-sdk import already exists
  if (!content.includes('anyflow-sdk')) {
    // Add import statement based on type
    if (type === 'ts') {
      content = `import anyflow from 'anyflow-sdk';\n${content}`;
    } else {
      content = `const anyflow = require('anyflow-sdk');\n${content}`;
    }
  }

  // Add the setup call if not already present
  if (!content.includes('anyflow.setup()')) {
    if (type === 'ts') {
      // For TypeScript, look for last import statement
      const importEndIndex = content.lastIndexOf('import ');
      if (importEndIndex !== -1) {
        // Find the end of the last import statement
        const nextSemicolon = content.indexOf(';', importEndIndex);
        if (nextSemicolon !== -1) {
          // Add the setup call after the last import statement
          content = content.substring(0, nextSemicolon + 1) +
            '\n\nanyflow.setup();' +
            content.substring(nextSemicolon + 1);
        } else {
          // If no semicolon found, add after requires
          const lastRequireIndex = findLastRequireStatement(content);
          if (lastRequireIndex !== -1) {
            content = insertAfterPosition(content, lastRequireIndex, '\nanyflow.setup();\n');
          } else {
            // Add at the beginning, after our added import
            const firstNewline = content.indexOf('\n');
            if (firstNewline !== -1) {
              content = content.substring(0, firstNewline + 1) +
                '\nanyflow.setup();\n' +
                content.substring(firstNewline + 1);
            } else {
              content = `${content}\n\nanyflow.setup();\n`;
            }
          }
        }
      } else {
        // Check for require statements instead
        const lastRequireIndex = findLastRequireStatement(content);
        if (lastRequireIndex !== -1) {
          content = insertAfterPosition(content, lastRequireIndex, '\nanyflow.setup();\n');
        } else {
          // No imports or requires found, add after our added import
          const firstNewline = content.indexOf('\n');
          if (firstNewline !== -1) {
            content = content.substring(0, firstNewline + 1) +
              '\nanyflow.setup();\n' +
              content.substring(firstNewline + 1);
          } else {
            content = `${content}\n\nanyflow.setup();\n`;
          }
        }
      }
    } else {
      // For JavaScript, look for require statements
      const lastRequireIndex = findLastRequireStatement(content);
      if (lastRequireIndex !== -1) {
        content = insertAfterPosition(content, lastRequireIndex, '\nanyflow.setup();\n');
      } else {
        // No requires found, add after our added import
        const firstNewline = content.indexOf('\n');
        if (firstNewline !== -1) {
          content = content.substring(0, firstNewline + 1) +
            '\nanyflow.setup();\n' +
            content.substring(firstNewline + 1);
        } else {
          content = `${content}\n\nanyflow.setup();\n`;
        }
      }
    }
  }

  // Replace any spread config usage with anyflow.mergeHardhatConfig
  if (type === 'ts') {
    // Find TypeScript-style export 
    const exportRegex = /export\s+default\s+([a-zA-Z0-9_]+);?/;
    const exportMatch = content.match(exportRegex);

    if (exportMatch) {
      const configName = exportMatch[1];
      const originalExport = exportMatch[0];

      // Replace the export statement
      const newExport = `export default anyflow.mergeHardhatConfig(${configName});`;
      content = content.replace(originalExport, newExport);
    } else {
      // Find HardhatUserConfig object with any variable name
      const configRegex = /const\s+(\w+)\s*:\s*HardhatUserConfig\s*=\s*{[\s\S]*?};/;
      const match = content.match(configRegex);

      if (match) {
        const configName = match[1];

        // Add export statement at the end of the file
        content += `\nexport default anyflow.mergeHardhatConfig(${configName});\n`;
      } else {
        logger.warn('Could not find HardhatUserConfig object in TypeScript file. Manual configuration may be required.');
      }
    }
  } else {
    // For JavaScript files
    // Look for module.exports pattern
    const moduleExportsRegex = /module\.exports\s*=\s*({[\s\S]*?}|[a-zA-Z0-9_]+);?/;
    const moduleExportsMatch = content.match(moduleExportsRegex);

    if (moduleExportsMatch) {
      const originalExport = moduleExportsMatch[0];
      const configValue = moduleExportsMatch[1];

      // Replace the module.exports statement
      const newExport = `module.exports = anyflow.mergeHardhatConfig(${configValue});`;
      content = content.replace(originalExport, newExport);
    } else {
      // Try to find a config object
      const configRegex = /const\s+(\w+)\s*=\s*{[\s\S]*?};/;
      const match = content.match(configRegex);

      if (match) {
        const configName = match[1];

        // Add module.exports statement at the end of the file if not present
        if (!content.includes('module.exports')) {
          content += `\nmodule.exports = anyflow.mergeHardhatConfig(${configName});\n`;
        } else {
          logger.warn('Found module.exports but could not modify it safely. Manual configuration may be required.');
        }
      } else {
        logger.warn('Could not find config object in JavaScript file. Manual configuration may be required.');
      }
    }
  }

  return content;
}

// Helper function to find the position after the last require statement
function findLastRequireStatement(content: string): number {
  // Look for the last require statement
  const requireMatches = [...content.matchAll(/require\([^)]+\);?/g)];
  if (requireMatches.length > 0) {
    const lastRequire = requireMatches[requireMatches.length - 1];
    if (lastRequire.index !== undefined) {
      return lastRequire.index + lastRequire[0].length;
    }
  }
  return -1;
}

// Helper function to insert content after a specific position
function insertAfterPosition(content: string, position: number, newContent: string): string {
  // Find the end of the line where position is located
  const lineEndIndex = content.indexOf('\n', position);
  if (lineEndIndex !== -1) {
    return content.substring(0, lineEndIndex + 1) + newContent + content.substring(lineEndIndex + 1);
  } else {
    return content + newContent;
  }
}

export function checkHardhatConfigContent(content: string): { sdkImported: boolean, setupCalled: boolean, configMerged: boolean } {
  const sdkImported = content.includes('anyflow-sdk'); // Covers import and require
  const setupCalled = content.includes('anyflow.setup()');
  const configMerged = content.includes('anyflow.mergeHardhatConfig(');

  return { sdkImported, setupCalled, configMerged };
}

export async function isAnyflowSdkSetupCorrectly(): Promise<boolean> {
  const hardhatConfigResult = await findHardhatConfig();

  if (!hardhatConfigResult || !hardhatConfigResult.path) {
    // findHardhatConfig already logs a warning if it cannot find the file.
    // This indicates a core part of the setup is missing.
    return false;
  }

  const projectDir = path.dirname(hardhatConfigResult.path);

  // 1. Check package.json for anyflow-sdk
  try {
    const packageJsonPath = path.join(projectDir, 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJsonData = JSON.parse(packageJsonContent);
    const dependencies = packageJsonData.dependencies || {};
    const devDependencies = packageJsonData.devDependencies || {};
    if (!dependencies['anyflow-sdk'] && !devDependencies['anyflow-sdk']) {
      logger.debug('anyflow-sdk not found in package.json dependencies or devDependencies.');
      return false;
    }
  } catch (error) {
    logger.debug('Failed to read or parse package.json:', error instanceof Error ? error.message : error);
    return false; // package.json is missing or unreadable
  }

  // 2. Check Hardhat config content
  try {
    const configContent = await fs.readFile(hardhatConfigResult.path, 'utf-8');
    const { sdkImported, setupCalled, configMerged } = checkHardhatConfigContent(configContent);

    if (!sdkImported) {
      logger.debug('anyflow-sdk import not found in Hardhat config. Run');
      return false;
    }
    if (!setupCalled) {
      logger.debug('anyflow.setup() call not found in Hardhat config.');
      return false;
    }
    if (!configMerged) {
      logger.debug('anyflow.mergeHardhatConfig() usage not found in Hardhat config.');
      return false;
    }
  } catch (error) {
    logger.debug(`Failed to read Hardhat config file (${hardhatConfigResult.path}):`, error instanceof Error ? error.message : error);
    return false; // Hardhat config is unreadable
  }

  return true;
}
