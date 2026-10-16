import { defineConfig } from 'cypress';
import codeCoverageTask from '@cypress/code-coverage/task';
import webpackPreprocessor from '@cypress/webpack-batteries-included-preprocessor';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/integration/**/*.spec.{js,mjs,ts}',
    // Node-only specs import `node:http`, which the webpack preprocessor cannot
    // compile — it fails preparing the file, before any test runs. They are run
    // by mocha instead; see the `mocha:run` script.
    excludeSpecPattern: [
      '**/__snapshots__/**',
      '**/*.snap',
      '**/node-native-fetch.spec.mjs',
    ],
    setupNodeEvents(on, config) {
      // Register code coverage
      codeCoverageTask(on, config);

      // Use the batteries-included webpack preprocessor and modify the config
      on(
        'file:preprocessor',
        webpackPreprocessor({
          webpackOptions: ((options: any) => {
            // Exclude 'undici' from being bundled
            options.externals = {
              ...options.externals,
              undici: 'undici',
            };
            return options;
          })(webpackPreprocessor.getFullWebpackOptions()),
        })
      );

      return config;
    },
  },
});
