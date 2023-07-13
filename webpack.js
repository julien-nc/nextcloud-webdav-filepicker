const webpack = require('webpack')
const path = require('path')
const webpackConfig = require('@nextcloud/webpack-vue-config')
const ESLintPlugin = require('eslint-webpack-plugin')
const StyleLintPlugin = require('stylelint-webpack-plugin')

const buildMode = process.env.NODE_ENV
const isDev = buildMode === 'development'
webpackConfig.devtool = isDev ? 'cheap-source-map' : 'source-map'

webpackConfig.stats = {
    colors: true,
    modules: false,
}

webpackConfig.entry = {
	exampleVue: { import: path.join(__dirname, 'src', 'exampleVue.js'), filename: 'exampleVue.js' },
	wrapper: { import: path.join(__dirname, 'src', 'filePickerWrapper.js'), filename: 'filePickerWrapper.js' },
	mainComponent: { import: path.join(__dirname, 'src', 'NcWebdavFilePicker.js'), filename: 'Components/NcWebdavFilePicker.js' },
	filePickerComponent: { import: path.join(__dirname, 'src', 'FilePicker.js'), filename: 'Components/FilePicker.js' },
}

webpackConfig.output.library = 'NcWebdavFilePicker'
webpackConfig.output.libraryTarget = 'umd'

webpackConfig.resolve.fallback = {
	'path': require.resolve('path-browserify'),
	'buffer': require.resolve('buffer'),
	'util': require.resolve('util'),
}

webpackConfig.plugins.push(
	// fix "process is not defined" error:
	// (do "npm install process" before running the build)
	new webpack.ProvidePlugin({
		process: 'process/browser',
	}),
)
webpackConfig.plugins.push(
	new ESLintPlugin({
		extensions: ['js', 'vue'],
		files: 'src',
		failOnError: !isDev,
	})
)
webpackConfig.plugins.push(
	new StyleLintPlugin({
		files: 'src/**/*.{css,scss,vue}',
		failOnError: !isDev,
	}),
)

webpackConfig.module.rules.push(
	{
	test: /\.mjs$/,
	include: /node_modules/,
	type: 'javascript/auto',
	resolve: {
		fullySpecified: false
	}
})

module.exports = webpackConfig
