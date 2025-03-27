#!/usr/bin/env node

import { EXIT_CODE_GENERIC_ERROR } from './utils/exitCodes';
import { performFullVersionCheck } from './utils/version-checker';

// This script is executed directly when the user runs `anyflow version:check`
performFullVersionCheck()
  .catch(error => {
    console.error('Error performing version check:', error);
    process.exit(EXIT_CODE_GENERIC_ERROR);
  }); 