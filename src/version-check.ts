#!/usr/bin/env node

import { performFullVersionCheck } from './utils/version-checker';

// This script is executed directly when the user runs `anyflow version:check`
performFullVersionCheck()
  .catch(error => {
    console.error('Error performing version check:', error);
    process.exit(1);
  }); 