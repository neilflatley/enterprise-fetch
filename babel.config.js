module.exports = {
  env: {
    legacy: {
      presets: [
        '@babel/typescript',
        [
          '@babel/preset-env',
          {
            modules: false,
            targets: ['IE >= 8', '> 1%'],
            useBuiltIns: 'entry',
          },
        ],
      ],
      plugins: [
        [
          '@babel/plugin-transform-regenerator',
          {
            asyncGenerators: true,
            generators: true,
            async: true,
          },
        ],
        '@babel/plugin-transform-runtime',
        '@babel/plugin-proposal-class-properties',
        '@babel/proposal-object-rest-spread',
        '@babel/plugin-syntax-export-default-from',
        '@babel/plugin-proposal-export-default-from',
        '@babel/plugin-transform-classes',
      ],
    },
    modern: {
      presets: [
        '@babel/typescript',
        [
          '@babel/preset-env',
          {
            bugfixes: true,
            // corejs: '3',
            loose: true,
            modules: false,
            targets: ['chrome 78', 'firefox 72'],
            // useBuiltIns: 'entry',
          },
        ],
      ],
      plugins: [
        ['@babel/plugin-proposal-class-properties', { loose: true }],
        '@babel/proposal-object-rest-spread',
      ],
    },
  },
  presets: [
    '@babel/typescript',
    [
      '@babel/preset-env',
      {
        bugfixes: true,
        corejs: '3',
        loose: true,
        targets: ['node 12'],
        useBuiltIns: 'entry',
      },
    ],
  ],
};
