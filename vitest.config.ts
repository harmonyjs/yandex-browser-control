import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

// Vitest Projects API configuration
// - Two projects: unit (threads) & integration (forks, serialized)
// - Explicit imports only (globals: false)
// - V8 coverage + JUnit reporter
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: false,
    reporters: ['default', 'junit', 'verbose'],
    outputFile: {
      junit: './test-results/junit.xml',
    },
    coverage: {
      provider: 'v8',
      all: true,
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.spec.ts',
        'src/**/*.integration.spec.ts',
        'src/**/*.d.ts',
        '**/index.ts',
        'src/tools/test-utils.ts',
      ],
    },
    projects: [
      {
        extends: true,
        test: {
          name: { label: 'unit', color: 'cyan' },
          include: ['src/**/*.spec.ts'],
          exclude: ['**/*.integration.spec.ts'],
          environment: 'node',
          pool: 'threads',
        },
      },
      {
        extends: true,
        test: {
          name: { label: 'integration', color: 'magenta' },
          include: ['src/**/*.integration.spec.ts'],
          environment: 'node',
          setupFiles: ['./vitest.setup.ts'],
          pool: 'forks',
          poolOptions: {
            forks: {
              singleFork: true,
              isolate: true,
            },
          },
          testTimeout: 60_000,
        },
      },
    ],
    deps: {
      optimizer: {
        ssr: {
          include: ['@modelcontextprotocol/sdk'],
        },
      },
    },
    server: {
      deps: {
        inline: [
          '@modelcontextprotocol/sdk',
          '@avavilov/apple-script',
        ],
      },
    },
  },
});
