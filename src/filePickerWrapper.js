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
import NcWebdavFilePicker from './components/NcWebdavFilePicker.vue'

window.createFilePicker = (mp, options) => {
	const View = Vue.extend(NcWebdavFilePicker)
	return new View({
		propsData: {
			ncUrl: options.url,
			ncLogin: options.login,
			ncPassword: options.password,
			ncAccessToken: options.accessToken,
			ncOidcConfig: options.oidcConfig,
			oidcConfigLocation: options.oidcConfigLocation,
			useCookies: options.useCookies,
			themeColor: options.themeColor,
			darkMode: options.darkMode,
			displayPreviews: options.displayPreviews,
			displayQuotaRefresh: options.displayQuotaRefresh,
			multipleDownload: options.multipleDownload,
			multipleUpload: options.multipleUpload,
			closeOnError: options.closeOnError,
			enableGetFilesPath: options.enableGetFilesPath,
			enableGetFilesLink: options.enableGetFilesLink,
			enableDownloadFiles: options.enableDownloadFiles,
			enableGetSaveFilePath: options.enableGetSaveFilePath,
			enableGetUploadFileLink: options.enableGetUploadFileLink,
			enableUploadFiles: options.enableUploadFiles,
			language: options.language,
			useWebapppassword: options.useWebapppassword,
			useModal: options.useModal,
		},
	}).$mount('#' + mp)
}
