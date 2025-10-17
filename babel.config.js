module.exports = {
  env: {
    legacy: {
      presets: [
        [
          '@babel/preset-env',
          {
            corejs: '2',
            targets: ['IE >= 8', '> 1%'],
            useBuiltIns: 'entry',
          },
        ],
      ],
      plugins: [
        '@babel/plugin-transform-runtime',
      ],
    },
    modern: {
      presets: [
        [
          '@babel/preset-env',
          {
            bugfixes: true,
            loose: true,
            targets: ['chrome 78', 'firefox 72'],
          },
        ],
      ],
      plugins: [
      ],
    },
  },
  presets: [
    [
      '@babel/preset-env',
      {
        bugfixes: true,
        corejs: '3',
        loose: true,
        targets: ['node 22'],
        useBuiltIns: 'entry',
      },
    ],
  ],
};
