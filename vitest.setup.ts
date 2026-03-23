import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

// Setup DOM before each test
beforeEach(() => {
  // Ensure document.body exists
  if (!document.body) {
    document.body = document.createElement('body');
  }
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
