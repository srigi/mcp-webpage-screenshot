// Initialize logger for all tests in both TS and compiled JS modules
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
try {
  const { createLogger } = require('./src/utils/logger');
  createLogger({ debugConfig: { enabled: false } });
} catch (_) {
  // If JS module doesn't exist yet, that's fine
}

try {
  const { createLogger } = require('./src/utils/logger.js');
  createLogger({ debugConfig: { enabled: false } });
} catch (_) {
  // If JS module doesn't exist yet, that's fine
}
