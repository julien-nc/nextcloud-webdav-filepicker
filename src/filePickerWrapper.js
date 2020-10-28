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

window.createFilePicker = function(mp, url, login, password) {
	const vm = new Vue({
		el: '#' + mp,
		render: h => h(NcFilePicker, {
			props: {
				ncUrl: url,
				ncLogin: login,
				ncPassword: password,
			},
		}),
	})

	return vm.$children[0]
}
