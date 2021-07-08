<template>
	<div class="nextcloud-filepicker">
		<div id="trigger-buttons">
			<div v-if="enableGetFilesPath" @click="getFilesPath">
				<slot name="get-files-path">
					<button>
						<span class="icon icon-download" />
						{{ t('filepicker', 'Get files path') }}
					</button>
				</slot>
			</div>
			<div v-if="enableGetFilesLink" @click="onGetFilesLinkClick">
				<slot name="get-files-link">
					<button>
						<span class="icon icon-public" />
						{{ t('filepicker', 'Get files link') }}
					</button>
				</slot>
			</div>
			<div v-if="enableDownloadFiles" @click="downloadFiles">
				<slot name="download-files">
					<button>
						<span class="icon icon-download" />
						{{ t('filepicker', 'Download files') }}
					</button>
				</slot>
			</div>
			<div v-if="enableGetSaveFilePath" @click="getSaveFilePath">
				<slot name="get-save-file-path">
					<button>
						<span class="icon icon-upload" />
						{{ t('filepicker', 'Get save file path') }}
					</button>
				</slot>
			</div>
			<div v-if="enableGetUploadFileLink" @click="getUploadFileLink">
				<slot name="get-upload-fileLink">
					<button>
						<span class="icon icon-upload" />
						{{ t('filepicker', 'Get file upload link') }}
					</button>
				</slot>
			</div>
			<div v-if="enableUploadFiles" @click="openFileInput">
				<slot name="open-file-input">
					<button>
						<span class="icon icon-upload" />
						{{ t('filepicker', 'Upload files') }}
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
			<FilePicker
				:get-title="getTitle"
				:put-title="putTitle"
				:loading-directory="loadingDirectory"
				:uploading-files="uploadingFiles"
				:upload-progress="uploadProgress"
				:downloading-files="downloadingFiles"
				:dark-mode="myDarkMode"
				:current-path="currentPath"
				:current-elements="currentElements"
				:connected="connected"
				:mode="mode"
				:multiple-download="multipleDownload"
				:quota="quota"
				:files-to-upload="filesToUpload"
				@close="close(true)"
				@folder-clicked="onFolderClicked"
				@selection-changed="onSelectionChanged"
				@create-directory="createDirectory"
				@validate="onValidate"
				@breadcrumb-hash-changed="onBreadcrumbChange" />
		</Modal>
	</div>
</template>

<script>
import { t, n } from '../translation'
import { WebDavFetchClient } from '../webdavFetchClient'
import moment from '@nextcloud/moment'
import Modal from '@nextcloud/vue/dist/Components/Modal'
import { colorOpacity } from '../utils'
import '../../css/filepicker.scss'
import axios from 'axios'

import FilePicker from './FilePicker'

export default {
	name: 'NcWebdavFilePicker',

	components: {
		Modal,
		FilePicker,
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
		// OIDC access token
		ncOidcToken: {
			type: String,
			default: '',
		},
		// Include cookies in WebDav and OCS requests if this is true
		useCookies: {
			type: Boolean,
			default: false,
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
			default: false,
		},
		// display the button to get files links
		enableGetFilesLink: {
			type: Boolean,
			default: false,
		},
		// display the button to download files
		enableDownloadFiles: {
			type: Boolean,
			default: false,
		},
		// display the button to get a save file path
		enableGetSaveFilePath: {
			type: Boolean,
			default: false,
		},
		// display the button to get webdav upload link
		enableGetUploadFileLink: {
			type: Boolean,
			default: false,
		},
		// display the button to upload local files
		enableUploadFiles: {
			type: Boolean,
			default: false,
		},
	},

	data() {
		return {
			t,
			n,
			// initialize values with props
			login: this.ncLogin,
			password: this.ncPassword,
			accessToken: this.ncAccessToken,
			oidcToken: this.ncOidcToken,
			url: this.ncUrl,
			mainColor: this.themeColor || '#0082c9',
			myDarkMode: this.darkMode,
			// state data
			client: null,
			connected: false,
			isOpen: false,
			currentElements: [],
			currentElementsByPath: {},
			currentPath: '/',
			selection: [],
			quota: null,
			loadingDirectory: false,
			uploadingFiles: false,
			uploadProgress: 0,
			downloadingFiles: false,
			downloadProgress: 0,
			// link settings
			linkLabel: '',
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
				'--color-primary': this.mainColor,
				'--color-primary-element': this.mainColor,
				'--color-primary-text': '#ffffff',
				'--color-primary-element-light': this.mainColorLight,
				'--color-primary-light': this.mainColorLighter,
				'--color-main-background': this.mainBackgroundColor,
				'--color-border': this.colorBorder,
				'--color-border-dark': this.colorBorderDark,
				'--color-main-text': this.mainTextColor,
				'--color-text-lighter': this.colorTextLighter,
				'--color-background-hover': this.colorBackgroundHover,
				'--color-background-dark': this.colorBackgroundDark,
				'--color-background-darker': this.colorBackgroundDarker,
				'--default-font-size': '15px',
				'--font-face': '-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Oxygen-Sans,Cantarell,Ubuntu,\'Helvetica Neue\',Arial,\'Noto Color Emoji\',sans-serif,\'Apple Color Emoji\',\'Segoe UI Emoji\',\'Segoe UI Symbol\'',
			}
		},
		mainTextColor() {
			return this.myDarkMode
				? '#d8d8d8'
				: '#222'
		},
		mainBackgroundColor() {
			return this.myDarkMode
				? '#131313'
				: 'white'
		},
		colorBorder() {
			return this.myDarkMode
				? '#2a2a2a'
				: '#ededed'
		},
		colorBorderDark() {
			return this.myDarkMode
				? '#3c3c3c'
				: '#dbdbdb'
		},
		colorTextLighter() {
			return this.myDarkMode
				? '#b4b4b4'
				: '#767676'
		},
		colorBackgroundDark() {
			return this.myDarkMode
				? '#222222'
				: '#ededed'
		},
		colorBackgroundDarker() {
			return this.myDarkMode
				? '#2c2c2c'
				: '#dbdbdb'
		},
		colorBackgroundHover() {
			return this.myDarkMode
				? '#0a0a0a'
				: '#f5f5f5'
		},
		mainColorLight() {
			return this.myDarkMode
				? colorOpacity(this.mainColor, 0.6)
				: colorOpacity(this.mainColor, 0.4)
		},
		mainColorLighter() {
			return this.myDarkMode
				? colorOpacity(this.mainColor, 0.8)
				: colorOpacity(this.mainColor, 0.2)
		},
		authUrl() {
			return this.ncUrl + '/index.php/apps/webapppassword'
		},
		davUrl() {
			return this.ncUrl + '/remote.php/dav/files'
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
		ncOidcToken() {
			this.updateAccessToken(this.ncOidcToken)
		},
		themeColor() {
			this.setMainColor(this.themeColor)
		},
		darkMode() {
			this.setDarkMode(this.darkMode)
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
	},

	methods: {
		resetFilePicker() {
			this.client = null
			this.connected = false
			this.quota = null
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
		updateOidcToken(newValue) {
			this.resetFilePicker()
			this.oidcToken = newValue
		},
		setMainColor(color) {
			this.mainColor = color
		},
		setDarkMode(isEnabled) {
			this.myDarkMode = isEnabled
		},
		createClient() {
			// reset
			this.currentElements = []
			this.currentPath = '/'

			// basic http auth (classic password, app password or even oauth token)
			if (this.login && this.password) {
				this.client = new WebDavFetchClient({
					url: this.davUrl + '/' + this.login,
					username: this.login,
					password: this.password,
					useCookies: this.useCookies,
				})
				this.getFolderContent(true)
			} else if (this.login && this.accessToken) {
				// OAuth2 token
				this.client = new WebDavFetchClient({
					url: this.davUrl + '/' + this.login,
					token: {
						access_token: this.accessToken,
						token_type: 'Bearer',
					},
					useCookies: this.useCookies,
				})
				this.getFolderContent(true)
			} else if (this.login && this.oidcToken) {
				// OIDC token
				this.client = new WebDavFetchClient({
					url: this.davUrl + '/' + this.login,
					token: {
						access_token: this.oidcToken,
						token_type: 'oidc',
					},
					useCookies: this.useCookies,
				})
				this.getFolderContent(true)
			} else if (this.login) {
				// no auth, no web login
				this.client = new WebDavFetchClient({
					url: this.davUrl + '/' + this.login,
					username: this.login,
					useCookies: this.useCookies,
				})
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
		onGetFilesLinkClick(e) {
			this.getFilesLink()
		},
		getFilesLink(options = {}) {
			this.mode = 'getFilesLink'
			this.linkLabel = options.linkLabel || ''
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
			const closedEvent = new CustomEvent('filepicker-closed')
			document.dispatchEvent(closedEvent)
			if (manually) {
				this.$emit('manually-closed')
				const manuallyClosedEvent = new CustomEvent('filepicker-manually-closed')
				document.dispatchEvent(manuallyClosedEvent)
			}
		},
		onFolderClicked(path) {
			this.getFolderContent(false, path)
		},
		onSelectionChanged(selection) {
			this.selection = selection
		},
		onExpirationUpdate(e) {
			console.debug(e)
		},
		onBreadcrumbChange(path) {
			this.getFolderContent(false, path)
		},
		async onValidate(options = {}) {
			if (this.mode === 'uploadFiles') {
				console.debug('upload to ' + this.currentPath)
				console.debug(this.filesToUpload)
				this.webdavUploadFiles()
			} else if (this.mode === 'getFilesPath') {
				console.debug('get file path in ' + this.currentPath)
				const detail = { selection: this.selection }
				// for parent component
				this.$emit('get-files-path', detail)
				// for potential global listener
				const event = new CustomEvent('get-files-path', { detail })
				document.dispatchEvent(event)
				this.close()
			} else if (this.mode === 'getFilesLink') {
				const createdLinks = await this.getFilesShareLink(this.selection, options)
				// generate WebDav download links
				if (!this.password && this.accessToken) {
					console.error('Download links can\'t be generated when using OAuth, you can provide the OAuth token as a normal password.')
					this.close()
					return
				}
				let webdavLinks
				try {
					webdavLinks = this.selection.map((path) => {
						return this.client.getFileDownloadLink(path)
					})
				} catch (error) {
					console.error('Impossible to generate download links')
					console.error(error)
				}
				const ocsUrl = this.url + '/ocs/v2.php/apps/files_sharing/api/v1/shares'
				const genericShareLink = this.url + '/index.php/s/TOKEN'
				const detail = {
					webdavLinks,
					pathList: this.selection,
					ocsUrl,
					genericShareLink,
					shareLinks: createdLinks,
				}
				// for parent component
				this.$emit('get-files-link', detail)
				// for potential global listener
				const event = new CustomEvent('get-files-link', { detail })
				document.dispatchEvent(event)
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
				const uploadPath = this.currentPath.replace(/\/$/, '') + '/file.txt'
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
		async getFilesShareLink(pathList, options) {
			// create shared access with OCS API
			// problem : CORS headers don't allow this for the moment,
			// this could be done by adding a global origin whitelist in NC server
			const url = this.url + '/ocs/v2.php/apps/files_sharing/api/v1/shares'
			const publicLinks = []
			let path
			for (let i = 0; i < pathList.length; i++) {
				path = pathList[i]
				try {
					const headers = new Headers()
					this.client.appendAuthHeader(headers)
					headers.append('OCS-APIRequest', 'true')
					headers.append('Content-Type', 'application/json')
					headers.append('Accept', 'application/json')
					const req = {
						path,
						shareType: 3,
						label: this.linkLabel || 'File picker link',
						expireDate: options.expirationDate ? moment(options.expirationDate).format('YYYY-MM-DD') : null,
					}

					const rawResponse = await fetch(url, {
						method: 'POST',
						credentials: 'omit',
						headers,
						body: JSON.stringify(req),
					})
					const response = await rawResponse.json()

					publicLinks.push({
						path,
						url: response.ocs.data.url,
					})
					if (options.allowEdition || options.protectionPassword) {
						const shareId = response.ocs.data.id
						const putUrl = url + '/' + shareId
						const putReq = {
							permissions: options.allowEdition ? 3 : undefined,
							password: options.protectionPassword ? options.protectionPassword : undefined,
						}
						const useFetch = true
						if (useFetch) {
							const putHeaders = new Headers()
							this.client.appendAuthHeader(putHeaders)
							putHeaders.append('OCS-APIRequest', 'true')
							putHeaders.append('Content-Type', 'application/json')
							await fetch(putUrl, {
								method: 'PUT',
								credentials: 'omit',
								headers: putHeaders,
								body: JSON.stringify(putReq),
							}).then((response) => {
								if (response.status >= 400 && response.status < 600) {
									throw new Error('Bad response from server')
								}
								return response
							}).catch((error) => {
								console.debug('Impossible to edit shared access')
								console.debug(error)
							})
						} else {
							try {
								await axios.put(putUrl, putReq, {
									headers: {
										...this.client.getAuthHeader(),
										'OCS-APIRequest': 'true',
										'Content-Type': 'application/json',
									},
									// this has no effect, cookies are passed anyway
									withCredentials: false,
								})
							} catch (error) {
								console.error('Impossible to edit shared access')
								console.error(error.response?.data?.ocs?.meta?.message)
								console.error(error)
								return null
							}
						}
					}
				} catch (error) {
					console.error('Impossible to create public links')
					console.error(error)
					return null
				}
			}
			return publicLinks
		},
		async updateWebdavQuota() {
			if (this.client) {
				try {
					this.quota = await this.client.getQuota()
					console.debug('quota')
					console.debug(this.quota)
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
					await this.client.putFileContents(this.currentPath.replace(/\/$/, '') + '/' + file.name, file, {
						overwrite: true,
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
						console.error(error)
						errorFiles.push(file)
						continue
					} else {
						console.error(error)
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
					console.debug('TYPE')
					console.debug(typeof buff)
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
		async createDirectory(newDirectoryName) {
			const newDirectoryPath = this.currentPath.replace(/^\/$/, '') + '/' + newDirectoryName
			await this.webdavCreateDirectory(newDirectoryPath)
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
			cursor: pointer;
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

	.icon {
		min-width: 16px;
		min-height: 16px;
		display: inline-block;
	}
	button {
		height: 44px;
	}
	button .icon {
		mask-size: 16px auto;
		mask-position: center;
		-webkit-mask-size: 16px auto;
		-webkit-mask-position: center;
		background-color: var(--color-main-text);
		margin-bottom: -3px;
		width: 20px;
	}
	.icon-close {
		mask: url('./../../img/close.svg') no-repeat;
		-webkit-mask: url('./../../img/close.svg') no-repeat;
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
	.icon-rename {
		mask: url('./../../img/rename.svg') no-repeat;
		-webkit-mask: url('./../../img/rename.svg') no-repeat;
	}
	.icon-password {
		mask: url('./../../img/password.svg') no-repeat;
		-webkit-mask: url('./../../img/password.svg') no-repeat;
	}
	.icon-public {
		mask: url('./../../img/public.svg') no-repeat;
		-webkit-mask: url('./../../img/public.svg') no-repeat;
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
		background-color: var(--color-main-background);
		color: var(--color-main-text);
		border: 1px solid lightgrey;
		border-radius: 3px;
		padding: 0px 6px;
		height: 34px;
	}
}
</style>
