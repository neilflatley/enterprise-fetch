import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import pkg from './package.json' with { type: 'json' };

const extensions = ['.js', '.jsx', '.ts', '.tsx'];
const input = 'src/enterprise-fetch.ts';

const dynamicImportPlugin = () => ({
  name: 'dynamic-import-polyfill',
  renderDynamicImport() {
    return {
      left: '(',
      right: ')',
    };
  },
});

const moduleBuild = ({ dist }) => ({
  input,
  output: {
    file: `dist/enterprise-fetch.${dist}.js`,
    format: dist,
    inlineDynamicImports: true,
    exports: 'named',
  },
  external: Object.keys(pkg.dependencies),
  plugins: [
    resolve({
      extensions,
    }),
    commonjs(),
    typescript({ declaration: false, sourceMap: false }),
  ],
});

const browserBuild = ({ dist, babelEnv, name, minify }) => ({
  input,
  output: {
    file: `dist/client/enterprise-fetch.${dist}${minify ? '.min' : ''}.js`,
    format: 'umd',
    name,
    globals: {
      'enterprise-fetch': name,
    },
    inlineDynamicImports: true,
    exports: 'named',
  },
  external: ['node-fetch', 'https-proxy-agent'],
  plugins: [
    resolve({
      browser: true,
      extensions,
      mainFields: ['browser', 'module', 'main'],
    }),
    commonjs(),
    typescript({ declaration: false, sourceMap: false }),
    babel({
      babelHelpers: babelEnv === 'legacy' ? 'runtime' : 'bundled',
      envName: babelEnv,
      // exclude: 'node_modules/**',
      extensions,
      include:
        babelEnv === 'legacy'
          ? [
            'src/**',
            'node_modules/abort-controller/**',
            'node_modules/err-code/**',
          ]
          : 'src/**',
    }),
    dynamicImportPlugin(),
    minify && terser(),
  ],
});

export default [
  moduleBuild({ dist: 'esm' }),
  moduleBuild({ dist: 'cjs' }),
  browserBuild({
    dist: 'esm',
    babelEnv: 'modern',
    name: 'enterprise-fetch',
    minify: false,
  }),
  browserBuild({
    dist: 'esm',
    babelEnv: 'modern',
    name: 'enterprise-fetch',
    minify: true,
  }),
  browserBuild({
    dist: 'cjs',
    babelEnv: 'legacy',
    name: 'enterprise-fetch-legacy',
    minify: false,
  }),
  browserBuild({
    dist: 'cjs',
    babelEnv: 'legacy',
    name: 'enterprise-fetch-legacy',
    minify: true,
  }),
];
