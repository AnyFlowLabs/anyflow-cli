import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
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

async function copyConfigFile(projectPath: string): Promise<void> {
  const packagePath = path.join(__dirname, '../hardhat.config.ts');
  
  const destPath = path.join(projectPath, 'hardhat.anyflow.config.ts');
  
  try {
    await fs.copyFile(packagePath, destPath);
    logger.success('Successfully copied Anyflow Hardhat configuration file');
  } catch (error) {
    logger.error('Error copying configuration file:', error instanceof Error ? error : undefined);
    throw error;
  }
}

export async function install() {
  logger.info('Performing local file manipulation...');

  // Find the hardhat.config.ts file
  let hardhatConfig: HardhatConf = await findHardhatConfig();

  if (hardhatConfig.path.length < 1) {
    hardhatConfig = await promptForConfigPath();
  }

  if (!hardhatConfig) {
    logger.error('Could not locate hardhat.config.ts(js) file. Installation aborted.');
    return;
  }

  // Copiar o arquivo de configuração para o projeto
  const projectDir = path.dirname(hardhatConfig.path);
  await copyConfigFile(projectDir);

  // Read the existing config file
  let configContent = await fs.readFile(hardhatConfig.path, 'utf-8');

  // Modify the config content
  configContent = updateHardhatConfig(configContent, hardhatConfig.type);

  // Write the updated config back to the file
  await fs.writeFile(hardhatConfig.path, configContent, 'utf-8');

  logger.success('Successfully updated hardhat.config.ts');
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
  // Check if anyflow-cli import already exists
  if (!content.includes('anyflow-cli')) {
    // Add import statement based on type
    if (type === 'ts') {
      content = `import AnyflowHardhatConfig from "./hardhat.anyflow.config";\n${content}`;
    } else {
      content = `const AnyflowHardhatConfig = require("./hardhat.anyflow.config");\n${content}`;
    }
  }

  // Find the HardhatUserConfig object with any variable name
  const configRegex = /const\s+(\w+)\s*:\s*HardhatUserConfig\s*=\s*{[\s\S]*?};/;
  const match = content.match(configRegex);

  if (match) {
    const existingConfig = match[0];
    const configName = match[1];

    // Check if ...anyflowConfig already exists
    if (!existingConfig.includes('...AnyflowHardhatConfig')) {
      const updatedConfig = existingConfig.replace(
        /({[\s\S]*?)(};)/,
        '$1  ...AnyflowHardhatConfig,\n$2'
      );
      content = content.replace(existingConfig, updatedConfig);
    }

    // Update the export statement if it exists
    const exportRegex = new RegExp(`export\\s+default\\s+${configName};`);
    if (!exportRegex.test(content)) {
      // If no export statement found, add one
      content += `\nexport default ${configName};\n`;
    }
  } else {
    logger.warn('Could not find HardhatUserConfig object. Manual configuration may be required.');
  }

  return content;
}
