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

window.createFilePicker = (mp, url, login, password, accessToken, themeColor,
	multipleDownload = true, multipleUpload = true,
	enableGetFilesPath = true, enableGetFilesLink = true, enableDownloadFiles = true,
	enableGetSaveFilePath = true, enableGetUploadFileLink = true, enableUploadFiles = true) => {
	const vm = new Vue({
		el: '#' + mp,
		render: h => h(NcFilePicker, {
			props: {
				ncUrl: url,
				ncLogin: login,
				ncPassword: password,
				ncAccessToken: accessToken,
				themeColor,
				multipleDownload,
				multipleUpload,
				enableGetFilesPath,
				enableGetFilesLink,
				enableDownloadFiles,
				enableGetSaveFilePath,
				enableGetUploadFileLink,
				enableUploadFiles,
			},
		}),
	})

	return vm.$children[0]
}
