# AnyFlow CLI

The official command-line interface for AnyFlow operations. This CLI allows you to interact with the AnyFlow ecosystem, deploy smart contracts, and manage your projects.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [First Use and Authentication](#first-use-and-authentication)
- [Commands](#commands)
- [Configuration](#configuration)
- [New Features](#new-features)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install -g anyflow-cli
```

## Usage

After installation, you can use the CLI with the `anyflow` command:

```bash
anyflow [command] [options]
```

## First Use and Authentication

To get started with the AnyFlow CLI, you'll need to authenticate your session. Follow these steps:

1. **Initialize Your Project**: If you are starting a new project, navigate to your project directory:

   ```bash
   mkdir my-anyflow-project
   cd my-anyflow-project
   ```

2. **Run the Init Command**: This command will create the necessary environment variables:

   ```bash
   anyflow init
   ```

3. **Run the Install Command**: This will update your `hardhat.config.js` with the necessary configuration:

   ```bash
   anyflow install
   ```

4. **Authenticate**: Run the following command to authenticate your session:

   ```bash
   anyflow auth
   ```

   This command will prompt you for your API key and may attempt to open your browser. Enter your API key when prompted to complete the authentication process.

5. **Verify Authentication**: After successful authentication, you can verify that you are logged in by running:

   ```bash
   anyflow check-auth
   ```

   If you see a confirmation message, you are successfully authenticated and ready to use the CLI.

## Commands

### `anyflow <command>`

Available commands:

- `help`: Show help information for AnyFlow CLI.
- `init`: Create the necessary environment variables.
- `install`: Update your `hardhat.config.js` with the necessary configuration.
- `auth`: Authenticate your session with AnyFlow.
- `check-auth`: Check your authentication status.
- `deploy`: Upload your artifacts to the AnyFlow platform and deploy your project.
  - `--networks <network...>`: Specify networks to deploy to
  - `--deterministic-addresses` or `-da`: Use deterministic addresses
- `logout`: Clear your authentication credentials.
- `fix`: Fix failed deployments.
- `version:check`: Check for newer versions of the CLI.

## Configuration

The CLI can be configured through environment variables. You can create a `.env` file in your project root with the following variables:

```
# API Configuration
API_URL=https://api.anyflow.pro

# Bugsnag Error Reporting (only active in production)
BUGSNAG_API_KEY=your_bugsnag_key

# Node Environment
NODE_ENV=development
```

## New Features

### Version Checking

The CLI now automatically checks for updates when running commands. If a new version is available, it will notify you. You can also manually check for updates:

```bash
anyflow version:check
```

### Error Reporting

The CLI now includes error reporting via Bugsnag to help us identify and fix issues faster. This is only active in production environments and doesn't collect any sensitive data.

### Improved Logging

The CLI now has improved logging with color-coded output and different log levels:

- DEBUG: Detailed debugging information
- INFO: General operational information
- SUCCESS: Successful operations
- WARNING: Potential issues that don't prevent operation
- ERROR: Error conditions

### Environment Validation

The CLI now validates environment variables to prevent runtime errors due to missing or invalid configuration.

## Contributing

We welcome contributions to the AnyFlow CLI! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for details on how to contribute.

## License

This project is licensed under the ISC License.
