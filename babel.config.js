module.exports = {
  env: {
    legacy: {
      presets: [
        [
          '@babel/preset-env',
          {
            modules: false,
            targets: ['IE >= 8', '> 1%'],
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
        // '@babel/plugin-transform-runtime',
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-syntax-export-default-from',
        '@babel/plugin-proposal-export-default-from',
        '@babel/plugin-transform-classes',
      ],
    },
    modern: {
      presets: [
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
      plugins: [['@babel/plugin-proposal-class-properties', { loose: true }]],
    },
  },
};