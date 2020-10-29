const fs = require('fs')
const gettextParser = require('gettext-parser')
const nodeExternals = require('webpack-node-externals')
const path = require('path');
const webpack = require('webpack')

// https://github.com/alexanderwallin/node-gettext#usage
// https://github.com/alexanderwallin/node-gettext#load-and-add-translations-from-mo-or-po-files
const translations = fs
	.readdirSync('./l10n')
	.filter(name => name !== 'messages.pot' && name.endsWith('.pot'))
	.map(file => {
		const path = './l10n/' + file
		const locale = file.substr(0, file.length -'.pot'.length)

		const po = fs.readFileSync(path)
		const json = gettextParser.po.parse(po)
		return {
			locale,
			json
		}
	})

module.exports = {
	entry: {
		index: path.join(__dirname, 'lib/index.ts')
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		library: 'NextcloudMoment',
		libraryTarget: 'umd'
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /(node_modules)/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env']
					}
				}
			},
		]
	},
	plugins: [
		new webpack.DefinePlugin({
			LOCALES: JSON.stringify(translations),
		})
	],
	resolve: {
		extensions: ['*', '.js', '.ts', '.po'],
		symlinks: false
	},
	externals: [nodeExternals()]
}
