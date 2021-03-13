import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

const moduleBuild = ({ dist, babelEnv, name }) => ({
  inlineDynamicImports: true,
  input: 'src/enterprise-fetch.ts',
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
  input: 'src/enterprise-fetch.ts',
  output: {
    file: `dist/client/enterprise-fetch.${dist}${minify ? '.min' : ''}.js`,
    format: 'iife',
    name,
  },
  //   external: Object.keys(pkg.dependencies),
  external: ['cross-fetch', 'https-proxy-agent'],
  plugins: [
    resolve({
      browser: true,
      extensions,
      mainFields: ['module', 'main'],
    }),
    commonjs({}),
    babel({
      exclude: 'node_modules/**',
      extensions,
      babelHelpers: 'bundled',
      envName: babelEnv,
    }),
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
    name: 'efetch',
    minify: false,
  }),
  browserBuild({
    dist: 'cjs',
    babelEnv: 'legacy',
    name: 'efetch',
    minify: true,
  }),
];
