#!/usr/bin/env node

import { init } from 'src/server/server';

process.removeAllListeners('warning');
try {
  await init();
} catch (error) {
  console.error('Server initialization error:', error);
  process.exit(1);
}
