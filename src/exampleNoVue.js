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
			ncUrl: 'https://ripley.minifox.fr/nc/n20git',
			login: 'julien',
			password: '',
		},
	}),
})

document.getElementById('selectButton').addEventListener('click', function(e) {
	comp.$children[0].getFilePath()
})

document.addEventListener('pathSelected', function(e) {
	console.debug(e.detail)
})
