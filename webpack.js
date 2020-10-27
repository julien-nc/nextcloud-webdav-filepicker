const path = require('path')
const webpackConfig = require('@nextcloud/webpack-vue-config')

const buildMode = process.env.NODE_ENV
const isDev = buildMode === 'development'
webpackConfig.devtool = isDev ? 'cheap-source-map' : 'source-map'

webpackConfig.entry = {
	exampleVue: { import: path.join(__dirname, 'src', 'exampleVue.js'), filename: 'exampleVue.js' },
	exampleNoVue: { import: path.join(__dirname, 'src', 'exampleNoVue.js'), filename: 'exampleNoVue.js' },
}

webpackConfig.resolve.fallback = { 'path': require.resolve('path-browserify') }

module.exports = webpackConfig
