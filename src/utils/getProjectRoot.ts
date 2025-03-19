export async function getProjectRoot() {
  // Using dynamic imports because of conflicts
  const pkgDir = await import('pkg-dir');
  const packageDirectory = pkgDir.packageDirectory;
  const rootDir = await packageDirectory();

  if (!rootDir) {
    console.error('Error: Could not find the project root');
    process.exit(1);
  }

  return rootDir;
}