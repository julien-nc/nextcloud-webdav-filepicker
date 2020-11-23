const webpack = require('webpack')
const path = require('path')
const webpackConfig = require('@nextcloud/webpack-vue-config')

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
	component: { import: path.join(__dirname, 'src', 'ncFilePicker.js'), filename: 'Components/ncFilePicker.js' },
}

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

module.exports = webpackConfig
