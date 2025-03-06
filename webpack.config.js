const path = require('path');
const fs = require('fs');
const Dotenv = require('dotenv-webpack');
const { DefinePlugin } = require('webpack');
const ShebangPlugin = require('webpack-shebang-plugin');

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

    console.log(`Building using environment file: ${envPath || 'No .env file found'}`);

    return {
        mode: environment === 'production' ? 'production' : 'development',
        devtool: environment === 'production' ? 'source-map' : 'inline-source-map',
        entry: {
            'cli': './src/cli.ts',
            'version-check': './src/version-check.ts'
        },
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'dist'),
            clean: true
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
            new ShebangPlugin(),
            new Dotenv({
                path: envPath || false,
                systemvars: true, // Load system environment variables as well
                safe: false, // Don't require an .env.example file
                defaults: false, // Don't load .env.defaults
            }),
            new DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(environment),
                'process.env.CLI_VERSION': JSON.stringify(require('./package.json').version),
            }),
        ],
        target: 'node', // Set for CLI/Node.js applications
    };
};
