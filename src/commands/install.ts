import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import { execSync } from 'child_process';
import logger from '../utils/logger';
import { getProjectRoot } from '../utils/getProjectRoot';

import packageJson from '../../package.json';

const name = packageJson.name;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

type HardhatConf = {
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

async function findHardhatConfig(dir = process.cwd()): Promise<{ path: string; type: string }> {
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

async function promptForConfigPath(): Promise<HardhatConf> {
  return new Promise(async (resolve) => {
    rl.question('Please enter the path to your hardhat.config.ts(js) file: ', async (answer) => {
      const dir = await getProjectRoot();

      if (!dir) {
        logger.error('Could not find project root directory.');

        rl.close();

        process.exit(1);
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
    // Find a good place to add the setup call - after imports but before config
    const importEndIndex = content.lastIndexOf('import ');
    if (importEndIndex !== -1) {
      // Find the end of the last import statement
      const nextSemicolon = content.indexOf(';', importEndIndex);
      if (nextSemicolon !== -1) {
        // Add the setup call after the last import statement
        content = content.substring(0, nextSemicolon + 1) + 
                 '\n\nanyflow.setup();\n' + 
                 content.substring(nextSemicolon + 1);
      } else {
        // If no semicolon found, add at the beginning
        content = `${content}\n\nanyflow.setup();\n`;
      }
    } else {
      // No imports found, add at the beginning
      content = `anyflow.setup();\n\n${content}`;
    }
  }

  // Replace any spread config usage with anyflow.mergeHardhatConfig
  // Find the export statement
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
      logger.warn('Could not find HardhatUserConfig object. Manual configuration may be required.');
    }
  }

  return content;
}
