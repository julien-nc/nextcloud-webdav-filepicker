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
import NcWebdavFilePicker from './components/NcWebdavFilePicker'

// eslint-disable-next-line
'use strict'

window.createFilePicker = (mp, options) => {
	const vm = new Vue({
		el: '#' + mp,
		render: h => h(NcWebdavFilePicker, {
			props: {
				ncUrl: options.url,
				ncLogin: options.login,
				ncPassword: options.password,
				ncAccessToken: options.accessToken,
				ncOidcToken: options.oidcToken,
				useCookies: options.useCookies,
				themeColor: options.themeColor,
				darkMode: options.darkMode,
				multipleDownload: options.multipleDownload,
				multipleUpload: options.multipleUpload,
				enableGetFilesPath: options.enableGetFilesPath,
				enableGetFilesLink: options.enableGetFilesLink,
				enableDownloadFiles: options.enableDownloadFiles,
				enableGetSaveFilePath: options.enableGetSaveFilePath,
				enableGetUploadFileLink: options.enableGetUploadFileLink,
				enableUploadFiles: options.enableUploadFiles,
			},
		}),
	})

	return vm.$children[0]
}
