import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
// import pkg from './package.json';

const isProd = process.env.NODE_ENV === 'production';
const extensions = ['.js', '.jsx', '.ts', '.tsx'];
const browserBuild = (dist, babelEnv, name) => ({
  inlineDynamicImports: true,
  input: 'src/enterprise-fetch.ts',
  output: {
    file: `dist/client/enterprise-fetch.${dist}${isProd ? '.min' : ''}.js`,
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
    isProd && terser(),
  ],
});

export default [
  browserBuild('esm', 'modern', 'efetch'),
  browserBuild('cjs', 'legacy', 'efetch'),
];
