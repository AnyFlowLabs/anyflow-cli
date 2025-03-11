# Contributing to AnyFlow CLI

We love your input! We want to make contributing to AnyFlow CLI as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

1. Fork the repository and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

## Local Development Setup

1. Clone the repo
   ```
   git clone https://github.com/yourusername/anyflow-cli.git
   cd anyflow-cli
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Build the project
   ```
   npm run build:dev
   ```

4. Link the package to use it locally
   ```
   npm link
   ```

5. Now you can run the CLI with your changes
   ```
   anyflow help
   ```

## Environment Setup

The CLI supports different environment configurations:

- Development: `.env.development` or `.env.development.local`
- Staging: `.env.staging` or `.env.staging.local`
- Production: `.env.production` or `.env.production.local`

Example `.env.development`:
```
API_URL=https://api-dev.anyflow.pro
BUGSNAG_API_KEY=your_key_here
```

## Project Structure

```
├── .github/              # GitHub workflow configurations
├── dist/                 # Compiled output (not tracked by git)
├── src/                  # Source code
│   ├── commands/         # CLI command implementations
│   ├── config/           # Configuration files
│   ├── errors/           # Error handling
│   ├── events/           # Event system
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── cli.ts            # Main entry point
│   └── version-check.ts  # Version checking utility
├── .env.development      # Development environment variables
├── .eslintrc.js          # ESLint configuration
├── package.json          # Project metadata
├── tsconfig.json         # TypeScript configuration
└── webpack.config.js     # Webpack configuration
```

## Releasing

To release a new version:

1. Update the version in `package.json` following [Semantic Versioning](https://semver.org/).
2. Create a new tag with the version number
   ```
   git tag -a v1.0.14 -m "Version 1.0.14"
   git push origin v1.0.14
   ```
3. The CI/CD pipeline will automatically build and publish the package to npm.

## License

By contributing, you agree that your contributions will be licensed under the project's ISC license. 