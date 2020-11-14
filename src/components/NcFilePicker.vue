<template>
	<div class="nextcloud-filepicker">
		<div id="trigger-buttons">
			<div v-if="enableGetFilesPath" @click="getFilesPath">
				<slot name="get-files-path">
					<button>
						<span class="icon icon-download" />
						{{ gt.gettext('Get files path') }}
					</button>
				</slot>
			</div>
			<div v-if="enableGetFilesLink" @click="getFilesLink">
				<slot name="get-files-link">
					<button>
						<span class="icon icon-public" />
						{{ gt.gettext('Get files link') }}
					</button>
				</slot>
			</div>
			<div v-if="enableDownloadFiles" @click="downloadFiles">
				<slot name="download-files">
					<button>
						<span class="icon icon-download" />
						{{ gt.gettext('Download files') }}
					</button>
				</slot>
			</div>
			<div v-if="enableGetSaveFilePath" @click="getSaveFilePath">
				<slot name="get-save-file-path">
					<button>
						<span class="icon icon-upload" />
						{{ gt.gettext('Get save file path') }}
					</button>
				</slot>
			</div>
			<div v-if="enableGetUploadFileLink" @click="getUploadFileLink">
				<slot name="get-upload-fileLink">
					<button>
						<span class="icon icon-upload" />
						{{ gt.gettext('Get file upload link') }}
					</button>
				</slot>
			</div>
			<div v-if="enableUploadFiles" @click="openFileInput">
				<slot name="open-file-input">
					<button>
						<span class="icon icon-upload" />
						{{ gt.gettext('Upload files') }}
					</button>
				</slot>
			</div>
		</div>
		<input v-show="false"
			id="file-input"
			ref="myFiles"
			type="file"
			:multiple="multipleUpload"
			@change="onFileInputChange">
		<Modal v-if="isOpen"
			:can-close="false"
			:style="cssVars"
			@close="close">
			<div class="modal__content">
				<div class="modal__header">
					<h2>
						{{ modalTitle }}
					</h2>
					<span v-show="loadingDirectory || uploadingFiles"
						:class="{ icon: true, 'icon-loading': true, rotate: true, dark: darkMode }" />
					<button class="closeButton"
						@click="close(true)" />
				</div>
				<div class="bread-container">
					<PickerBreadcrumbs
						:parts="currentPathParts"
						:disabled="loadingDirectory || uploadingFiles || downloadingFiles"
						@hash-changed="onBreadcrumbChange" />
				</div>
				<FileBrowser v-if="connected && currentElements.length > 0"
					:elements="sortedCurrentElements"
					:forced-selection="browserSelection"
					:can-select-files="['getFilesPath', 'getFilesLink', 'downloadFiles'].includes(mode)"
					:multiple-select="multipleDownload"
					:disabled="loadingDirectory || uploadingFiles || downloadingFiles"
					:style="cssVars"
					@folder-clicked="onFolderClicked"
					@selection-changed="onSelectionChanged" />
				<EmptyContent v-else-if="connected"
					icon="icon-folder"
					class="empty-content"
					:style="cssVars">
					{{ gt.gettext('This directory is empty') }}
				</EmptyContent>
				<EmptyContent v-else icon="icon-disabled-user" class="empty-content">
					{{ gt.gettext('File picker is not connected') }}
				</EmptyContent>

				<ProgressBar v-if="uploadingFiles"
					size="medium"
					:bar-color="mainColorLight"
					:val="uploadProgress"
					:text="uploadProgress + '%'" />
				<ProgressBar v-if="downloadingFiles"
					size="medium"
					:bar-color="mainColorLight"
					:val="downloadProgress"
					:text="downloadProgress + '%'" />
				<div v-else class="footer">
					<ProgressBar v-if="quota"
						size="small"
						class="quota"
						:bar-color="mainColorLight"
						:text-fg-color="mainTextColor"
						:val="quotaPercent"
						:text="quotaText" />
					<div v-if="connected && ['getSaveFilePath', 'uploadFiles', 'getUploadFileLink'].includes(mode)"
						class="newDirectory">
						<button v-if="!namingNewDirectory"
							v-tooltip.top="{ content: gt.gettext('Create new directory'), classes: this.darkMode ? 'dark' : '' }"
							class="newDirectoryButton"
							@click="onCreateDirectory">
							<span class="icon icon-add" />
						</button>
						<div v-else
							class="newDirectoryForm">
							<input v-model="newDirectoryName"
								type="text"
								:placeholder="gt.gettext('New directory name')"
								@keyup.escape="onCancelNewDirectory"
								@keyup.enter="createDirectory">
							<button
								v-tooltip.top="{ content: gt.gettext('Cancel'), classes: this.darkMode ? 'dark' : '' }"
								class="newDirectoryButton"
								@click="onCancelNewDirectory">
								<span class="icon icon-history" />
							</button>
							<button
								v-tooltip.top="{ content: gt.gettext('Ok'), classes: this.darkMode ? 'dark' : '' }"
								class="newDirectoryButton"
								@click="createDirectory">
								<span class="icon icon-checkmark" />
							</button>
						</div>
					</div>
					<button v-if="showSelectNone"
						@click="selectNone">
						{{ gt.gettext('Select none') }}
					</button>
					<button v-if="showSelectAll"
						@click="selectAll">
						{{ gt.gettext('Select all') }}
					</button>

					<button v-if="connected && canValidate"
						id="validate"
						@click="onValidate">
						{{ validateButtonText }}
					</button>
				</div>
			</div>
		</Modal>
	</div>
</template>

<script>
import { createClient } from 'webdav/web'
import moment from '@nextcloud/moment'
import axios from 'axios'
import { dirname, basename } from '@nextcloud/paths'
import { getGettextBuilder } from '@nextcloud/l10n/dist/gettext'
import Modal from '@nextcloud/vue/dist/Components/Modal'
import EmptyContent from '@nextcloud/vue/dist/Components/EmptyContent'
import PickerBreadcrumbs from './PickerBreadcrumbs'
import FileBrowser from './FileBrowser'
import { humanFileSize, colorOpacity, colorLuminance } from '../utils'
import ProgressBar from 'vue-simple-progress'
import '../../css/filepicker.scss'

import Vue from 'vue'
import { VTooltip } from 'v-tooltip'
Vue.directive('tooltip', VTooltip)

export default {
	name: 'NcFilePicker',

	components: {
		Modal,
		ProgressBar,
		EmptyContent,
		PickerBreadcrumbs,
		FileBrowser,
	},

	props: {
		/* === reactive props === */
		// Nextcloud base URL
		ncUrl: {
			type: String,
			required: true,
		},
		// Nextcloud user name
		ncLogin: {
			type: String,
			default: '',
		},
		// Nextcloud user password/app password/OAuth access token
		ncPassword: {
			type: String,
			default: '',
		},
		// OAuth access token if you absolutely want to use Bearer Authorization header (if not, using a token as a password works fine)
		ncAccessToken: {
			type: String,
			default: '',
		},
		/* === props to control the fp component from the parent one === */
		// file picker mode to determine what is done when the picker is opened
		pickerMode: {
			type: String,
			default: '',
		},
		// prop to open the file picker if you don't want to use the buttons
		pickerIsOpen: {
			type: Boolean,
			default: false,
		},
		/* === options === */
		// enable multiple selection in all download modes
		multipleDownload: {
			type: Boolean,
			default: true,
		},
		// enable multiple local files selection when uploading
		multipleUpload: {
			type: Boolean,
			default: true,
		},
		// file picker title
		getTitle: {
			type: String,
			default: null,
		},
		putTitle: {
			type: String,
			default: null,
		},
		// theming (reactive too)
		themeColor: {
			type: String,
			default: '#0082c9',
			validator: (value) => {
				return value.match(/^#[0-9a-fA-F]{6}$/)
			},
		},
		darkMode: {
			type: Boolean,
			default: false,
		},
		/* === toggle buttons === */
		// display the button to get files path
		enableGetFilesPath: {
			type: Boolean,
			default: true,
		},
		// display the button to get files links
		enableGetFilesLink: {
			type: Boolean,
			default: true,
		},
		// display the button to download files
		enableDownloadFiles: {
			type: Boolean,
			default: true,
		},
		// display the button to get a save file path
		enableGetSaveFilePath: {
			type: Boolean,
			default: true,
		},
		// display the button to get webdav upload link
		enableGetUploadFileLink: {
			type: Boolean,
			default: true,
		},
		// display the button to upload local files
		enableUploadFiles: {
			type: Boolean,
			default: true,
		},
	},

	data() {
		return {
			// initialize values with props
			login: this.ncLogin,
			password: this.ncPassword,
			accessToken: this.ncAccessToken,
			url: this.ncUrl,
			mainColor: this.themeColor || '#0082c9',
			// state data
			client: null,
			connected: false,
			isOpen: false,
			currentElements: [],
			currentElementsByPath: {},
			currentPath: '/',
			selection: [],
			browserSelection: [],
			quota: null,
			loadingDirectory: false,
			uploadingFiles: false,
			uploadProgress: 0,
			downloadingFiles: false,
			downloadProgress: 0,
			// new dir
			namingNewDirectory: false,
			creatingDirectory: false,
			newDirectoryName: '',
			// modes : getFilesPath, downloadFiles, getFilesLink, getSaveFilePath, uploadFiles, getUploadFileLink
			mode: '',
			loginWindow: null,
			filesToUpload: [],
			// translations
			gt: null,
		}
	},

	computed: {
		cssVars() {
			return {
				'--main-color': this.mainColor,
				'--main-color-light': this.mainColorLight,
				'--main-color-lighter': this.mainColorLighter,
				'--main-color-dark': this.mainColorDark,
				'--main-color-darker': this.mainColorDarker,
				'--main-background-color': this.mainBackgroundColor,
				'--main-text-color': this.mainTextColor,
				'--color-text-lighter': this.colorTextLighter,
				'--color-background-hover': this.colorBackgroundHover,
				'--color-background-dark': this.colorBackgroundDark,
			}
		},
		mainTextColor() {
			return this.darkMode
				? '#d8d8d8'
				: '#222'
		},
		mainBackgroundColor() {
			return this.darkMode
				? '#131313'
				: 'white'
		},
		colorTextLighter() {
			return this.darkMode
				? '#b4b4b4'
				: '#767676'
		},
		colorBackgroundDark() {
			return this.darkMode
				? '#222222'
				: '#ededed'
		},
		colorBackgroundHover() {
			return this.darkMode
				? '#0a0a0a'
				: '#f5f5f5'
		},
		mainColorLight() {
			return this.darkMode
				? colorOpacity(this.mainColor, 0.6)
				: colorOpacity(this.mainColor, 0.4)
		},
		mainColorLighter() {
			return this.darkMode
				? colorOpacity(this.mainColor, 0.8)
				: colorOpacity(this.mainColor, 0.2)
		},
		mainColorDark() {
			return colorLuminance(this.mainColor, -0.2)
		},
		mainColorDarker() {
			return colorLuminance(this.mainColor, -0.4)
		},
		authUrl() {
			return this.ncUrl + '/index.php/apps/webapppassword'
		},
		davUrl() {
			return this.ncUrl + '/remote.php/dav/files'
		},
		modalTitle() {
			if (['getFilesPath', 'downloadFiles', 'getFilesLink'].includes(this.mode)) {
				if (this.multipleDownload) {
					return this.getTitle || this.gt.gettext('Select one or multiple files')
				} else {
					return this.getTitle || this.gt.gettext('Select a file')
				}
			} else if (['getSaveFilePath', 'uploadFiles', 'getUploadFileLink'].includes(this.mode)) {
				return this.putTitle || 'Save to'
			}
			return ''
		},
		currentFiles() {
			return this.currentElements.filter((e) => {
				return e.type === 'file'
			})
		},
		currentPathParts() {
			const parts = []
			let tmpPath = this.currentPath
			while (tmpPath && tmpPath !== '/') {
				parts.push({
					name: basename(tmpPath),
					path: tmpPath,
				})
				tmpPath = dirname(tmpPath)
			}
			return parts.slice().reverse()
		},
		sortedCurrentElements() {
			return this.currentElements.slice().sort((a, b) => {
				return a.basename.toLowerCase().localeCompare(b.basename.toLowerCase())
			})
		},
		quotaPercent() {
			if (this.quota?.used && this.quota?.available) {
				const available = parseInt(this.quota.available)
				const used = parseInt(this.quota.used)
				return (!isNaN(available) && available !== 0 && !isNaN(used))
					? parseInt(used / available * 100)
					: 0
			} else {
				return 0
			}
		},
		quotaText() {
			if (this.quota?.used && this.quota?.available) {
				const available = parseInt(this.quota.available)
				const used = parseInt(this.quota.used)
				return !isNaN(used)
					? (!isNaN(available) && available !== 0)
						? this.gt.gettext('{size} used ({percent} % of {total})', { size: this.myHumanFileSize(used, true), percent: this.quotaPercent, total: this.myHumanFileSize(available, true) })
						: this.gt.gettext('{size} used', { size: this.myHumanFileSize(used, true) })
					: this.gt.gettext('invalid quota used')
			} else {
				return this.gt.gettext('invalid quota')
			}
		},
		validateButtonText() {
			if (['getFilesPath', 'getFilesLink', 'downloadFiles'].includes(this.mode)) {
				const nbSelected = this.selection.length
				return this.gt.ngettext('Get {nbSelected} selected file', 'Get {nbSelected} selected files', nbSelected, { nbSelected })
			} else if (['getSaveFilePath', 'getUploadFileLink'].includes(this.mode)) {
				return this.gt.gettext('Save to {path}', { path: basename(this.currentPath) || '/' })
			} else if (['uploadFiles'].includes(this.mode)) {
				const nbToUpload = this.filesToUpload.length
				return this.gt.ngettext('Upload {nbToUpload} file to {path}', 'Upload {nbToUpload} files to {path}', nbToUpload, { nbToUpload, path: basename(this.currentPath) || '/' })
			}
			return ''
		},
		canValidate() {
			if (['getFilesPath', 'getFilesLink', 'downloadFiles'].includes(this.mode)) {
				return this.selection.length > 0
			} else if (this.mode === 'uploadFiles') {
				return this.filesToUpload.length > 0
			} else {
				return true
			}
		},
		showSelectNone() {
			return ['getFilesPath', 'getFilesLink', 'downloadFiles'].includes(this.mode) && this.selection.length > 0
		},
		showSelectAll() {
			return ['getFilesPath', 'getFilesLink', 'downloadFiles'].includes(this.mode) && this.selection.length < this.currentFiles.length
		},
	},

	watch: {
		ncLogin() {
			this.updateLogin(this.ncLogin)
		},
		ncPassword() {
			this.updatePassword(this.ncPassword)
		},
		ncUrl() {
			this.updateUrl(this.ncUrl)
		},
		ncAccessToken() {
			this.updateAccessToken(this.ncAccessToken)
		},
		themeColor() {
			this.setMainColor(this.themeColor)
		},
		// let parent component control the fp
		pickerMode() {
			this.mode = this.pickerMode
		},
		pickerIsOpen() {
			if (this.pickerIsOpen) {
				this.isOpen = true
				this.getFolderContent(true)
			}
		},
	},

	created() {
		const lang = 'fr'
		const po = '../../translationfiles/fr_FR/filepicker.po'

		this.gt = getGettextBuilder()
			.detectLocale()
			.addTranslation(lang, po)
			.build()
	},

	methods: {
		resetFilePicker() {
			this.client = null
			this.connected = false
			this.quota = null
			this.namingNewDirectory = false
			this.newDirectoryName = ''
			this.uploadingFiles = false
		},
		updateUrl(newValue) {
			this.resetFilePicker()
			this.url = newValue
		},
		updateLogin(newValue) {
			this.resetFilePicker()
			this.login = newValue
		},
		updatePassword(newValue) {
			this.resetFilePicker()
			this.password = newValue
		},
		updateAccessToken(newValue) {
			this.resetFilePicker()
			this.accessToken = newValue
		},
		setMainColor(color) {
			this.mainColor = color
		},
		createClient() {
			// reset
			this.currentElements = []
			this.currentPath = '/'

			// basic http auth (classic password, app password or even oauth token)
			if (this.login && this.password) {
				this.client = createClient(
					this.davUrl + '/' + this.login, {
						username: this.login,
						password: this.password,
					}
				)
				this.getFolderContent(true)
			} else if (this.login && this.accessToken) {
				// OAuth2 token
				this.client = createClient(
					this.davUrl + '/' + this.login, {
						token: {
							access_token: this.accessToken,
							token_type: 'Bearer',
						},
					}
				)
				this.getFolderContent(true)
			} else {
				// web login flow
				const authUrl = this.authUrl + '?target-origin=' + encodeURIComponent(window.location.href)
				this.loginWindow = window.open(
					authUrl,
					'Nextcloud Login',
					'width=400,height=400,menubar=no,scrollbars=no,status=no,titlebar=no,toolbar=no'
				)
				window.addEventListener('message', this.onReceiveWindowMessage)
			}
		},
		onReceiveWindowMessage(e) {
			const data = e.data
			if (data.type === 'webapppassword') {
				if (this.loginWindow !== null) {
					this.loginWindow.close()
				}
				window.removeEventListener('message', this.onReceiveWindowMessage)
				this.login = data.loginName
				this.password = data.token
				this.createClient()
			}
		},
		openFileInput() {
			this.$refs.myFiles.click()
		},
		getFilesPath() {
			this.mode = 'getFilesPath'
			this.openFilePicker()
		},
		getFilesLink() {
			this.mode = 'getFilesLink'
			this.openFilePicker()
		},
		uploadFiles() {
			this.mode = 'uploadFiles'
			this.openFilePicker()
		},
		downloadFiles() {
			this.mode = 'downloadFiles'
			this.openFilePicker()
		},
		getSaveFilePath() {
			this.mode = 'getSaveFilePath'
			this.openFilePicker()
		},
		getUploadFileLink() {
			this.mode = 'getUploadFileLink'
			this.openFilePicker()
		},
		openFilePicker() {
			this.isOpen = true
			this.getFolderContent(true)
		},
		onUnauthorized(response) {
			const detail = { response }
			this.$emit('filepicker-unauthorized', detail)
			const event = new CustomEvent('filepicker-unauthorized', { detail })
			document.dispatchEvent(event)
			// this.close()
		},
		async getFolderContent(updateQuota = false, path = null) {
			if (path) {
				this.currentPath = path
			}
			if (this.client === null) {
				this.createClient()
			} else {
				this.selection = []
				this.currentElementsByPath = {}
				this.loadingDirectory = true
				try {
					const directoryItems = await this.client.getDirectoryContents(this.currentPath)
					this.currentElements = directoryItems.map((el) => {
						this.currentElementsByPath[el.filename] = el
						return {
							...el,
							lastmod_ts: moment(el.lastmod).unix(),
						}
					})
					console.debug(this.currentElements)
					this.connected = true
				} catch (error) {
					console.error(error)
					if (error.response?.status === 401) {
						this.onUnauthorized(error.response)
					}
					this.resetFilePicker()
				}
				this.loadingDirectory = false
				if (updateQuota) {
					this.updateWebdavQuota()
				}
			}
		},
		close(manually = false) {
			this.isOpen = false
			this.$emit('closed')
			if (manually) {
				this.$emit('manually-closed')
			}
		},
		onFolderClicked(path) {
			this.getFolderContent(false, path)
		},
		onSelectionChanged(selection) {
			this.selection = selection
		},
		selectNone() {
			this.selection = []
			this.browserSelection = []
		},
		selectAll() {
			this.currentElements.forEach((e) => {
				if (e.type === 'file' && !this.selection.includes(e.filename)) {
					this.selection.push(e.filename)
				}
			})
			this.browserSelection = this.selection
		},
		onBreadcrumbChange(path) {
			this.getFolderContent(false, path)
		},
		onValidate() {
			if (this.mode === 'uploadFiles') {
				console.debug('upload to ' + this.currentPath)
				console.debug(this.filesToUpload)
				this.webdavUploadFiles()
			} else if (this.mode === 'getFilesPath') {
				console.debug('get file path in ' + this.currentPath)
				// const downloadLink = this.client.getFileDownloadLink(element)
				const detail = { selection: this.selection }
				// for parent component
				this.$emit('get-files-path', detail)
				// for potential global listener
				const event = new CustomEvent('get-files-path', { detail })
				document.dispatchEvent(event)
				this.close()
			} else if (this.mode === 'getFilesLink') {
				console.debug('get files link in ' + this.currentPath)
				// this.getFilesShareLink()
				// generate WebDav download links
				if (!this.password && this.accessToken) {
					console.error('Download links can\'t be generated when using OAuth, you can provide the OAuth token as a normal password.')
					this.close()
					return
				}
				try {
					const webdavLinks = this.selection.map((path) => {
						return this.client.getFileDownloadLink(path)
					})
					const ocsUrl = this.url + '/ocs/v2.php/apps/files_sharing/api/v1/shares'
					const genericShareLink = this.url + '/index.php/s/TOKEN'
					const detail = {
						webdavLinks,
						pathList: this.selection,
						ocsUrl,
						genericShareLink,
					}
					// for parent component
					this.$emit('get-files-link', detail)
					// for potential global listener
					const event = new CustomEvent('get-files-link', { detail })
					document.dispatchEvent(event)
				} catch (error) {
					console.error('Impossible to generate download links')
				}
				this.close()
			} else if (this.mode === 'getSaveFilePath') {
				console.debug('user wants to save in ' + this.currentPath)
				const detail = { path: this.currentPath }
				// for parent component
				this.$emit('get-save-file-path', detail)
				// for potential global listener
				const event = new CustomEvent('get-save-file-path', { detail })
				document.dispatchEvent(event)
				this.close()
			} else if (this.mode === 'getUploadFileLink') {
				console.debug('user wants to get an upload link in ' + this.currentPath)
				if (!this.password && this.accessToken) {
					console.error('Upload links can\'t be generated when using OAuth, you can provide the OAuth token as a normal password.')
					this.close()
					return
				}
				const uploadPath = this.currentPath + '/file.txt'
				try {
					const uploadLink = this.client.getFileUploadLink(uploadPath)
					const detail = {
						link: uploadLink,
						targetDir: this.currentPath,
					}
					// for parent component
					this.$emit('upload-path-link-generated', detail)
					// for potential global listener
					const event = new CustomEvent('upload-path-link-generated', { detail })
					document.dispatchEvent(event)
				} catch (error) {
					console.error('Impossible to generate upload link')
				}
				this.close()
			} else if (this.mode === 'downloadFiles') {
				console.debug('user wants to download files')
				console.debug(this.selection)
				this.webdavDownload()
			}
		},
		async getFilesShareLink() {
			// create shared access with OCS API
			// problem : CORS headers don't allow this for the moment,
			// this could be done by adding a global origin whitelist in NC server
			const url = this.url + '/ocs/v2.php/apps/files_sharing/api/v1/shares'
			const response = await axios.post(url, {
				path: '...',
				shareType: 3,
			}, {
				auth: {
					username: this.login,
					password: this.password || this.accessToken,
				},
				headers: { 'OCS-APIRequest': 'true' },
			})
			console.debug(response)
		},
		async updateWebdavQuota() {
			if (this.client) {
				try {
					this.quota = await this.client.getQuota()
				} catch (error) {
					console.error(error)
					if (error.response?.status === 401) {
						this.onUnauthorized(error.response)
					}
					this.resetFilePicker()
				}
			}
		},
		async webdavUploadFiles() {
			this.uploadingFiles = true
			this.uploadProgress = 0
			// calc total upload size
			let totalSize = 0
			let totalUploaded = 0
			for (let i = 0; i < this.filesToUpload.length; i++) {
				const file = this.filesToUpload[i]
				totalSize += file.size
			}

			const successFiles = []
			const errorFiles = []
			for (let i = 0; i < this.filesToUpload.length; i++) {
				const file = this.filesToUpload[i]
				try {
					await this.client
						.putFileContents(this.currentPath + '/' + file.name, file, {
							overwrite: false,
							onUploadProgress: progress => {
								// console.debug(`Uploaded ${progress.loaded} bytes of ${progress.total}`)
								console.debug(`uploaded ${totalUploaded + progress.loaded} on ${totalSize}`)
								this.uploadProgress = parseInt((totalUploaded + progress.loaded) / totalSize * 100)
							},
						})
				} catch (error) {
					// already exists or no permission
					if (error.response?.status === 412) {
						console.error('the file ' + file.name + ' could not be uploaded')
						errorFiles.push(file)
						continue
					} else {
						this.resetFilePicker()
						return
					}
				}
				successFiles.push(file)
				console.debug('UPLOAD success ' + file.name)
				totalUploaded += file.size
				this.uploadProgress = parseInt(totalUploaded / totalSize * 100)
				this.getFolderContent()
			}
			const detail = {
				targetDir: this.currentPath,
				successFiles,
				errorFiles,
			}
			// for parent component
			this.$emit('files-uploaded', detail)
			// for potential global listener
			const event = new CustomEvent('files-uploaded', { detail })
			document.dispatchEvent(event)

			this.uploadingFiles = false
			this.uploadProgress = 0
			this.filesToUpload = []
			this.updateWebdavQuota()
		},
		async webdavDownload() {
			this.downloadingFiles = true
			this.downloadProgress = 0
			const results = []
			const errorFilePaths = []
			let totalSize = 0
			let totalDownloaded = 0
			for (let i = 0; i < this.selection.length; i++) {
				const filepath = this.selection[i]
				const selectedElement = this.currentElementsByPath[filepath]
				totalSize += selectedElement.size
			}
			for (let i = 0; i < this.selection.length; i++) {
				const filepath = this.selection[i]
				const selectedElement = this.currentElementsByPath[filepath]
				try {
					console.debug('DOWNLOADING ' + filepath)
					const buff = await this.client.getFileContents(filepath)
					const file = new File([buff], selectedElement.basename, { type: selectedElement.mime })
					results.push(file)
					totalDownloaded += selectedElement.size
					this.downloadProgress = parseInt(totalDownloaded / totalSize * 100)
				} catch (error) {
					console.error(error)
					if (error.response?.status === 401) {
						this.onUnauthorized(error.response)
						this.resetFilePicker()
						return
					}
					errorFilePaths.push(filepath)
					continue
				}
			}
			const detail = {
				successFiles: results,
				errorFilePaths,
			}
			// for parent component
			this.$emit('files-downloaded', detail)
			// for potential global listener
			const event = new CustomEvent('files-downloaded', { detail })
			document.dispatchEvent(event)
			this.close()
			this.downloadingFiles = false
			this.downloadProgress = 0
		},
		onCreateDirectory() {
			this.namingNewDirectory = true
		},
		onCancelNewDirectory() {
			this.namingNewDirectory = false
		},
		async createDirectory() {
			const newDirectoryPath = this.currentPath.replace(/^\/$/, '') + '/' + this.newDirectoryName
			await this.webdavCreateDirectory(newDirectoryPath)
			this.namingNewDirectory = false
			this.newDirectoryName = ''
			this.getFolderContent(false, newDirectoryPath)
		},
		async webdavCreateDirectory(path) {
			try {
				await this.client.createDirectory(path)
			} catch (error) {
				console.error(error)
				if (error.response?.status === 401) {
					this.onUnauthorized(error.response)
				}
				this.resetFilePicker()
			}
		},
		onFileInputChange(e) {
			this.filesToUpload = [...this.$refs.myFiles.files]
			this.uploadFiles()
		},
		myHumanFileSize(bytes, approx = false, si = false, dp = 1) {
			return humanFileSize(bytes, approx, si, dp)
		},
	},
}
</script>

<style scoped lang="scss">
.nextcloud-filepicker {
	#trigger-buttons {
		display: flex;

		button {
			padding: 10px;
			font-weight: bold;
			border-radius: 100px;
			border: 1px solid lightgrey;
		}
	}

	.icon {
		min-width: 16px;
		min-height: 16px;
		display: inline-block;
	}
	.icon-upload {
		background-image: url('./../../img/upload.svg');
	}
	.icon-download {
		background-image: url('./../../img/download.svg');
	}
	.icon-public {
		background-image: url('./../../img/public.svg');
	}
}

::v-deep .modal-container {
	display: flex !important;
	min-height: 80%;
	border-radius: 10px !important;

	.modal__content {
		width: 900px;
		// height: 800px;
		background: var(--main-background-color);
		color: var(--main-text-color);
		display: flex;
		flex-direction: column;
		padding: 20px;

		font-weight: normal;
		font-size: 0.875em;
		font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Cantarell,Ubuntu,'Helvetica Neue',Arial,'Noto Color Emoji',sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol';

		.rotate {
			animation: rotation 2s infinite linear;
		}

		button {
			padding: 10px;
			font-weight: bold;
			border-radius: 100px;
			border: 1px solid lightgrey;
			background-color: var(--color-background-dark);
			color: var(--main-text-color);
		}

		.closeButton {
			width: 44px;
			height: 44px;
			//background: no-repeat center/22px url('./../../img/close.svg');
			mask: url('./../../img/close.svg') no-repeat;
			mask-size: 22px auto;
			mask-position: center;
			-webkit-mask: url('./../../img/close.svg') no-repeat;
			-webkit-mask-size: 22px auto;
			-webkit-mask-position: center;
			background-color: var(--main-text-color);

			&:hover {
				background-color: var(--main-color);
			}
		}

		.newDirectoryButton {
			width: 44px;
			height: 44px;

			.icon {
				min-height: 14px;
			}
		}

		.modal__header {
			display: flex;

			h2 {
				margin: 10px 0 10px 0;
				flex-grow: 1;
			}
		}

		.bread-container {
			display: inline-flex;
			width: 100%;
			margin-top: 10px;
		}

		.footer {
			display: flex;
		}

		.quota {
			width: 170px;
			margin: 9px 20px 0 0;
			position: relative;
			bottom: -5px;
		}
	}

	.icon {
		min-width: 16px;
		min-height: 16px;
		display: inline-block;
	}
	button .icon {
		mask-size: 18px auto;
		mask-position: center;
		-webkit-mask-size: 18px auto;
		-webkit-mask-position: center;
		background-color: var(--main-text-color);
	}
	.icon-close {
		background-image: url('./../../img/close.svg');
	}
	.icon-add {
		mask: url('./../../img/add.svg') no-repeat;
		-webkit-mask: url('./../../img/add.svg') no-repeat;
	}
	.icon-history {
		mask: url('./../../img/history.svg') no-repeat;
		-webkit-mask: url('./../../img/history.svg') no-repeat;
	}
	.icon-checkmark {
		mask: url('./../../img/checkmark.svg') no-repeat;
		-webkit-mask: url('./../../img/checkmark.svg') no-repeat;
	}
	.icon-folder {
		mask: url('./../../img/folder.svg') no-repeat;
		mask-size: 30px auto;
		mask-position: center;
		-webkit-mask: url('./../../img/folder.svg') no-repeat;
		-webkit-mask-size: 30px auto;
		-webkit-mask-position: center;
		background-color: var(--main-color, grey);
	}
	.icon-disabled-user {
		mask: url('./../../img/disabled-user.svg') no-repeat;
		mask-size: 30px auto;
		mask-position: center;
		-webkit-mask: url('./../../img/disabled-user.svg') no-repeat;
		-webkit-mask-size: 30px auto;
		-webkit-mask-position: center;
		background-color: grey;
	}

	#validate {
		margin-left: auto;
	}

	.loading {
		flex-grow: 1;
		text-align: center;
		padding-top: 50px;
	}

	.icon-loading {
		margin-right: 10px;
		background: no-repeat center/30px url('./../../img/loading.png');
		width: 44px;
		height: 44px;

		&.dark {
			filter: invert(100%);
			-webkit-filter: invert(100%);
		}
	}

	.empty-content {
		flex-grow: 1;
		color: lightgrey;

		.icon-disabled-user,
		.icon-folder {
			mask-size: 65px auto;
			-webkit-mask-size: 65px auto;
		}
	}

	input[type=text] {
		-moz-appearance: textfield;
		-webkit-appearance: textfield;
		background-color: var(--main-background-color);
		color: var(--main-text-color);
		border: 1px solid lightgrey;
		border-radius: 3px;
		padding: 0px 6px;
		height: 34px;
	}
}

@keyframes rotation {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(359deg);
	}
}
</style>
