import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';
import importAssets from 'rollup-plugin-import-assets';

import { name } from './plugin.json';
import { createPathTransform } from 'rollup-sourcemap-path-transform';
// const production = process.env['BUILD_TYPE'] !== 'DEBUG';
const production = true;

export default defineConfig({
	input: './src/index.tsx',
	plugins: [
		commonjs(),
		nodeResolve(),
		typescript(),
		json(),
		replace({
			preventAssignment: false,
			'process.env.NODE_ENV': JSON.stringify('production'),
		}),
		importAssets({
			publicPath: `http://127.0.0.1:1337/plugins/${name}/`,
		}),
	],
	context: 'window',
	external: ['react', 'react-dom', 'decky-frontend-lib'],
	output: {
		file: 'dist/index.js',
		sourcemap: !production ? 'inline' : false,
		sourcemapPathTransform: !production
			? createPathTransform({
					prefixes: {
						'../src/': `/plugins/${name}/src/`,
						'../node_modules/.pnpm/': `/plugins/${name}/node_modules/`,
					},
					requirePrefix: true,
			  })
			: undefined,
		globals: {
			react: 'SP_REACT',
			'react-dom': 'SP_REACTDOM',
			'decky-frontend-lib': 'DFL',
		},
		format: 'iife',
		exports: 'default',
	},
});
