import { beforeAll, afterEach } from 'vitest';
import { vi } from 'vitest';

// Global integration test setup
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  // Increase listener limit to avoid MaxListenersExceededWarning in integration tests
  process.setMaxListeners(20);
});

afterEach(() => {
  // Clear mocks and restore state after each test
  vi.clearAllMocks();
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
