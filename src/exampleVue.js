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
import ExampleApp from './views/ExampleApp'

// eslint-disable-next-line
'use strict'

// eslint-disable-next-line
new Vue({
	el: '#mount_point',
	render: h => h(ExampleApp),
})
