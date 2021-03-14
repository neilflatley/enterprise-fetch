import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

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
  inlineDynamicImports: true,
  input,
  output: {
    file: `dist/enterprise-fetch.${dist}.js`,
    format: dist,
  },
  external: Object.keys(pkg.dependencies),
  plugins: [
    resolve({
      extensions,
    }),
    commonjs({}),
    babel({
      exclude: 'node_modules/**',
      extensions,
      babelHelpers: 'bundled',
    }),
  ],
});

const browserBuild = ({ dist, babelEnv, name, minify }) => ({
  inlineDynamicImports: true,
  input,
  output: {
    file: `dist/client/enterprise-fetch.${dist}${minify ? '.min' : ''}.js`,
    format: 'iife',
    name,
  },
  external: ['cross-fetch', 'https-proxy-agent'],
  plugins: [
    resolve({
      browser: true,
      extensions,
      mainFields: ['browser', 'module', 'main'],
    }),
    commonjs(),
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
    name: 'efetch',
    minify: false,
  }),
  browserBuild({
    dist: 'esm',
    babelEnv: 'modern',
    name: 'efetch',
    minify: true,
  }),
  browserBuild({
    dist: 'cjs',
    babelEnv: 'legacy',
    name: 'efetchLegacy',
    minify: false,
  }),
  browserBuild({
    dist: 'cjs',
    babelEnv: 'legacy',
    name: 'efetchLegacy',
    minify: true,
  }),
];
