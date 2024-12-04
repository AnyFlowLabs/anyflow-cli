import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import { getProjectRoot } from '../utils/getProjectRoot';
import { name } from '../../package.json';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

type HardhatConf = {
    path: string,
    type: string
}

export async function install() {
    console.log('Performing local file manipulation...');
    
    // Find the hardhat.config.ts file
    let hardhatConfig: HardhatConf = await findHardhatConfig()
    
    if (hardhatConfig.path.length < 1) {
        hardhatConfig = await promptForConfigPath();
    }

    if (!hardhatConfig) {
        console.error('Could not locate hardhat.config.ts(js) file. Installation aborted.');
        return;
    }

    // Read the existing config file
    let configContent = await fs.readFile(hardhatConfig.path, 'utf-8');

    // Modify the config content
    configContent = updateHardhatConfig(configContent, hardhatConfig.type);

    // Write the updated config back to the file
    await fs.writeFile(hardhatConfig.path, configContent, 'utf-8');

    console.log('Successfully updated hardhat.config.ts');
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
        console.warn('Could not find hardhat.config.ts(js) file automatically.');
        return {path: "", type: "js"};
    }

    return findHardhatConfig(parentDir);
}

async function promptForConfigPath(): Promise<HardhatConf> {
    return new Promise(async (resolve) => {
        rl.question('Please enter the path to your hardhat.config.ts(js) file: ', async (answer) => {
            const dir = await getProjectRoot();

            if (!dir) {
                console.error('Could not find project root directory.');

                rl.close();
                
                process.exit(1);
            }

            let fullPath = path.resolve(dir, answer);

            let extension

            if (!fullPath.includes("hardhat.config.ts") && !fullPath.includes("hardhat.config.js")) {
                extension = await new Promise<string>((resolveExt) => {
                    rl.question("Path does not contain hardhat.config.ts(js). Please enter the file extension (ts or js): ", resolveExt);
                });

                fullPath = path.resolve(fullPath, `hardhat.config.${extension}`);
            }else {
                extension = fullPath.includes("hardhat.config.ts") ? "ts" : "js"
            }
            
            try {
                const stats = await fs.stat(fullPath);

                if (stats.isFile()) {
                    rl.close();
                
                    resolve({path: fullPath, type: extension});
                } else {
                    console.error('The specified path is not a file.');
                    rl.close();
                
                    resolve({path: "", type: ""});
                }
            } catch (error) {
                console.error('The specified file does not exist or is not accessible.');
                
                rl.close();
                
                resolve({path: "", type: ""});
            }
        });
    });
}

function updateHardhatConfig(content: string, type: string): string {
    // Check if anyflow-cli import already exists
    if (!content.includes('anyflow-cli')) {
        // Add import statement based on type
        if (type === 'ts') {
            content = `import AnyflowHardhatConfig from "${name}/hardhat.config";\n${content}`;
        } else {
            content = `const AnyflowHardhatConfig = require("${name}/hardhat.config");\n${content}`;
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
                `$1  ...AnyflowHardhatConfig,\n$2`
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
        console.warn('Could not find HardhatUserConfig object. Manual configuration may be required.');
    }

    return content;
}
