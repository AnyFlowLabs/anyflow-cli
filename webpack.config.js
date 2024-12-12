const path = require('path');
const fs = require('fs');
const Dotenv = require('dotenv-webpack');
const { optimize } = require('webpack');

module.exports = (env) => {
    const environment = env.ENV || 'production'; // Use the environment passed during the build

    // Determine the correct .env file to load in order of priority
    const basePath = `.env.${environment}`;
    const localPath = `${basePath}.local`;
    const defaultPath = `.env`;

    // Check which file exists with priority for `.env`
    const envPath = fs.existsSync(defaultPath)
        ? defaultPath
        : fs.existsSync(localPath)
            ? localPath
            : fs.existsSync(basePath)
                ? basePath
                : null;

    console.log(`Building using environment file: ${envPath}`);

    return {
        mode: environment === 'production' ? 'production' : 'development',
        entry: './src/cli.ts', // Entry point for the CLI
        output: {
            filename: 'cli.js',
            path: path.resolve(__dirname, 'dist'),
        },
        resolve: {
            extensions: ['.ts', '.js'], // Resolve these extensions
        },
        module: {
            rules: [
                {
                    test: /\.ts$/, // Match TypeScript files
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
            ],
        },
        optimization: {
            minimize: false,
        },
        plugins: [
            new Dotenv({
                path: envPath
            }),
        ],
        target: 'node', // Set for CLI/Node.js applications
    };
};