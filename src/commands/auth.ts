import * as open from 'open';
import * as keytar from 'keytar';
import readline from 'readline';

const SERVICE_NAME = 'AnyFlowCLI';
const ACCOUNT_NAME = 'apiToken';

export async function authenticate() {
    console.log('Opening your browser to authenticate...');
    await open('https://anyflow.pro/api-tokens');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Please paste your API token here: ', async (token) => {
        if (token) {
            await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);
            console.log('Token stored securely.');
        } else {
            console.log('Invalid token.');
        }
        rl.close();
    });
}