export function handleAuthError(error: any) {
  console.error('\n❌ Authentication Error:');

  // Main error message
  if (error.message) {
    console.error(`\n  Message: ${error.message}`);
  }

  // Error details based on type
  if (error.response) {
    // API Error
    console.error('\n  API Response Details:');
    console.error(`    Status: ${error.response.status}`);
    console.error(`    Status Text: ${error.response.statusText}`);
    if (error.response.data?.message) {
      console.error(`    Server Message: ${error.response.data.message}`);
    }
  } else if (error.code) {
    // System/Node Error
    console.error('\n  System Error Details:');
    console.error(`    Code: ${error.code}`);
    console.error(`    System Path: ${error.path || 'N/A'}`);
  }

  // Keytar specific errors
  if (error.errno) {
    console.error('\n  Keychain Error Details:');
    console.error(`    Error Number: ${error.errno}`);
    console.error(`    System Call: ${error.syscall || 'N/A'}`);
  }

  // Development mode additional details
  if (process.env.NODE_ENV === 'development') {
    console.error('\n  Debug Information:');
    console.error('    Stack Trace:', error.stack);
    console.error('    Full Error Object:', JSON.stringify(error, null, 2));
  }

  console.error('\n📋 Troubleshooting Steps:');
  console.error('  1. Check your internet connection');
  console.error('  2. Verify the API token format');
  console.error('  3. Ensure you have necessary system permissions');
  console.error('  4. Check if keychain service is running (for Linux: gnome-keyring or kde-wallet)');

  if (process.platform === 'linux') {
    console.error('\n🐧 Linux-Specific Tips:');
    console.error('  • Install required packages:');
    console.error('    - For Ubuntu/Debian: sudo apt-get install libsecret-1-dev');
    console.error('    - For Red Hat/Fedora: sudo dnf install libsecret-devel');
    console.error('  • Ensure gnome-keyring or kde-wallet is running');
    console.error('  • Try running the command with sudo');
  }

  console.error('\n🔍 Need Help?');
  console.error('  • Documentation: https://docs.anyflow.pro');
  console.error('  • Report issues: https://github.com/AnyFlowLabs/anyflow-cli/issues');
  console.error('  • Support: support@anyflow.pro\n');
}