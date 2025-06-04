import { getChains } from './deploy/chains';
import logger from '../utils/logger';
import { EXIT_CODE_GENERIC_ERROR } from '../utils/exitCodes';
import chalk from 'chalk';

export async function listNetworks() {
    try {
        const chains = await getChains();

        logger.heading('Available Networks');

        const tableOutputLines: string[] = [];

        const chainIdColWidth = 12;
        const nameColWidth = 35;
        // Status column width is not strictly enforced by padding the status text itself,
        // but its starting position is determined by the preceding columns.

        // Header
        tableOutputLines.push(
            `\n${'Chain ID'.padEnd(chainIdColWidth)}${'Name'.padEnd(nameColWidth)}Status`
        );
        tableOutputLines.push('─'.repeat(chainIdColWidth + nameColWidth + 15)); // Adjusted for typical status width

        chains.forEach((chain) => {
            const status = chain.is_available ? '✓ Available' : '✗ Unavailable';
            const statusFormatted = chain.is_available ? chalk.green(status) : chalk.red(status);

            const idStr = String(chain.chain_id).padEnd(chainIdColWidth);
            // Ensure chain.name is treated as a string for padEnd
            const nameStr = String(chain.name).padEnd(nameColWidth);

            tableOutputLines.push(
                `${idStr}${nameStr}${statusFormatted}`
            );

            if (chain.aliases && chain.aliases.length > 0) {
                // Indent alias list to align under the Name column content.
                // The prefix includes padding for Chain ID column width, plus indentation for the alias marker.
                const aliasIndent = ' '.repeat(chainIdColWidth);
                tableOutputLines.push(`${aliasIndent}  ↳ Aliases: ${chalk.grey(chain.aliases.join(', '))}`);
            }
        });

        // Print the entire table as a single block
        console.log(tableOutputLines.join('\n'));

        logger.info('\nUse these networks with the deploy command:');
        logger.info('  anyflow deploy --networks <network1> <network2> ...');

    } catch (error) {
        logger.error('Failed to fetch available networks');
        if (error instanceof Error) {
            logger.debug(error.message);
        }
        process.exit(EXIT_CODE_GENERIC_ERROR);
    }
} 