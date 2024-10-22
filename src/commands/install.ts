import fs from 'fs/promises';
import path from 'path';
import { packageDirectory } from 'pkg-dir';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

export async function install() {
    console.log('Performing local file manipulation...');
    
    // Find the hardhat.config.ts file
    let hardhatConfigPath = await findHardhatConfig();
    
    if (!hardhatConfigPath) {
        hardhatConfigPath = await promptForConfigPath();
    }

    if (!hardhatConfigPath) {
        console.error('Could not locate hardhat.config.ts(js) file. Installation aborted.');
        return;
    }

    // Read the existing config file
    let configContent = await fs.readFile(hardhatConfigPath, 'utf-8');

    // Modify the config content
    configContent = updateHardhatConfig(configContent);

    // Write the updated config back to the file
    await fs.writeFile(hardhatConfigPath, configContent, 'utf-8');

    console.log('Successfully updated hardhat.config.ts');
}

async function findHardhatConfig(dir = process.cwd()): Promise<string | null> {
    const files = await fs.readdir(dir);
    const configFile = files.find(file => file === 'hardhat.config.ts' || file === 'hardhat.config.js');
    
    if (configFile) {
        return path.join(dir, configFile);
    }

    const parentDir = path.dirname(dir);

    if (parentDir === dir) {
        console.warn('Could not find hardhat.config.ts(js) file automatically.');
        return null; // Reached root directory
    }

    return findHardhatConfig(parentDir);
}

async function promptForConfigPath(): Promise<string | null> {
    return new Promise(async (resolve) => {
        rl.question('Please enter the path to your hardhat.config.ts(js) file: ', async (answer) => {
            const dir = await packageDirectory();

            if (!dir) {
                console.error('Could not find project root directory.');

                rl.close();
                
                process.exit(1);
            }

            let fullPath = path.resolve(dir, answer);

            if (!fullPath.includes("hardhat.config.ts") && !fullPath.includes("hardhat.config.js")) {
                const extension = await new Promise<string>((resolveExt) => {
                    rl.question("Path does not contain hardhat.config.ts(js). Please enter the file extension (ts or js): ", resolveExt);
                });

                fullPath = path.resolve(fullPath, `hardhat.config.${extension}`);
            }
            
            try {
                const stats = await fs.stat(fullPath);

                if (stats.isFile()) {
                    rl.close();
                
                    resolve(fullPath);
                } else {
                    console.error('The specified path is not a file.');
                    rl.close();
                
                    resolve(null);
                }
            } catch (error) {
                console.error('The specified file does not exist or is not accessible.');
                
                rl.close();
                
                resolve(null);
            }
        });
    });
}
function updateHardhatConfig(content: string): string {
    // Check if anyflow-cli import already exists
    if (!content.includes('anyflow-cli')) {
        // Add import statement
        content = `import AnyflowHardhatConfig from "anyflow-cli/hardhat.config";\n${content}`;
    }

    // Find the HardhatUserConfig object with any variable name
    const configRegex = /const\s+(\w+)\s*:\s*HardhatUserConfig\s*=\s*{[\s\S]*?};/;
    const match = content.match(configRegex);

    if (match) {
        const existingConfig = match[0];
        const configName = match[1]; // Capture the variable name

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
