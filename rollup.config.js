import babel from '@rollup/plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
// import pkg from './package.json';

const isProd = process.env.NODE_ENV === 'production';

const browserBuild = (dist, babelEnv, name) => ({
  inlineDynamicImports: true,
  input: 'dist/enterprise-fetch.js',
  output: {
    file: `dist/client/enterprise-fetch.${dist}${isProd ? '.min' : ''}.js`,
    format: 'iife',
    name,
  },
  //   external: Object.keys(pkg.dependencies),
  external: ['cross-fetch', 'https-proxy-agent'],
  plugins: [
    resolve({
      mainFields: ['module', 'main'],
      browser: true,
    }),
    commonjs({}),
    babel({
      exclude: 'node_modules/**',
      babelHelpers: 'bundled',
      envName: babelEnv,
    }),
    isProd && terser(),
  ],
});

export default [
  browserBuild('esm', 'modern', 'efetch'),
  browserBuild('cjs', 'legacy', 'efetch'),
];
