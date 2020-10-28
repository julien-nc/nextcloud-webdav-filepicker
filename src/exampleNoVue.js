/* jshint esversion: 6 */

/**
 * Nextcloud - filepicker
 *
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Julien Veyssier <eneiluj@posteo.net>
 * @copyright Julien Veyssier 2020
 */

import Vue from 'vue'
import './bootstrap'
import NcFilePicker from './components/NcFilePicker'

// eslint-disable-next-line
'use strict'

const comp = new Vue({
	el: '#mount_point',
	render: h => h(NcFilePicker, {
		props: {
			ncUrl: 'https://localhost/dev/server',
			ncLogin: 'julien',
			ncPassword: 'Nm8cC-kHczM-HGz55-S9SE2-Frf4F',
		},
	}),
})

document.getElementById('selectButton').addEventListener('click', function(e) {
	// console.debug(comp)
	// comp.$children[0].$props.login = 'juju'
	comp.$children[0].getFilePath()
})

document.addEventListener('pathSelected', function(e) {
	console.debug(e.detail)
})

document.addEventListener('filesDownloaded', function(e) {
	const files = e.detail
	console.debug('something was downloaded')
	files.forEach(file => {
		console.debug('File : ' + file.name)
		console.debug(file)
		const reader = new FileReader()
		reader.readAsText(file)
		reader.onload = function() {
			console.debug(reader.result)
		}
		reader.onerror = function() {
			console.error('Impossible to read downloaded file')
			console.debug(reader.error)
		}
	})
})
