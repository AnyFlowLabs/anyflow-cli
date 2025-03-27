import { EXIT_CODE_GENERIC_ERROR } from './exitCodes';

export async function getProjectRoot() {
  // Using dynamic imports because of conflicts
  const pkgDir = await import('pkg-dir');
  const packageDirectory = pkgDir.packageDirectory;
  const rootDir = await packageDirectory();

  if (!rootDir) {
    console.error('Error: Could not find the project root');
    process.exit(EXIT_CODE_GENERIC_ERROR);
  }

  return rootDir;
}