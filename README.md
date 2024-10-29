# AnyFlow CLI

A command-line interface (CLI) for performing operations with AnyFlow.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [First Use and Authentication](#first-use-and-authentication)
- [Commands](#commands)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## Installation

To install the `anyflow-cli` inside you project:

```bash
npm install anyflow-cli
```

## Usage

After installation, you can use the `anyflow` cli in your terminal. To see the available commands and options, run:

```bash
anyflow help
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

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Make your changes and commit them (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a pull request.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
