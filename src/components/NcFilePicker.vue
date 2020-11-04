<template>
	<div class="nextcloud-filepicker">
		<div id="trigger-buttons">
			<div v-if="enableGetFilesPath" @click="getFilesPath">
				<slot name="get-files-path">
					<button>
						<span class="icon icon-download" />
						Get files path
					</button>
				</slot>
			</div>
			<div v-if="enableGetFilesLink" @click="getFilesLink">
				<slot name="get-files-link">
					<button>
						<span class="icon icon-public" />
						Get files link
					</button>
				</slot>
			</div>
			<div v-if="enableDownloadFiles" @click="downloadFiles">
				<slot name="download-files">
					<button>
						<span class="icon icon-download" />
						Download files
					</button>
				</slot>
			</div>
			<div v-if="enableGetSaveFilePath" @click="getSaveFilePath">
				<slot name="get-save-file-path">
					<button>
						<span class="icon icon-upload" />
						Get save file path
					</button>
				</slot>
			</div>
			<div v-if="enableGetUploadFileLink" @click="getUploadFileLink">
				<slot name="get-upload-fileLink">
					<button>
						<span class="icon icon-upload" />
						Get file upload link
					</button>
				</slot>
			</div>
			<div v-if="enableOpenFileInput" @click="openFileInput">
				<slot name="open-file-input">
					<button>
						<span class="icon icon-upload" />
						Upload files
					</button>
				</slot>
			</div>
		</div>
		<input v-show="false"
			id="file-input"
			ref="myFiles"
			type="file"
			multiple
			@change="onFileInputChange">
		<Modal v-if="isOpen" @close="close">
			<div class="modal__content">
				<div class="modal__header">
					<h2>
						{{ modalTitle }}
					</h2>
					<span v-show="loadingDirectory || uploadingFiles" class="icon icon-loading rotate" />
					<button class="closeButton" @click="close" />
				</div>
				<div class="bread-container">
					<Breadcrumbs>
						<Breadcrumb title="Home" href="#/" />
						<Breadcrumb v-for="p in currentPathParts"
							:key="p.path"
							:title="p.name"
							:href="'#' + p.path" />
					</Breadcrumbs>
				</div>
				<v-table v-if="currentElements.length > 0"
					id="element-table"
					:data="sortedCurrentElements">
					<thead slot="head">
						<th style="width: 10%;" />
						<v-th sort-key="basename" style="width: 50%;">
							Name
						</v-th>
						<v-th sort-key="size" style="width: 15%;">
							Size
						</v-th>
						<v-th sort-key="lastmod_ts" style="width: 25%;">
							Modified
						</v-th>
					</thead>
					<tbody slot="body" slot-scope="{displayData}">
						<tr v-for="value in displayData"
							:key="value.filename"
							:style="cssVars"
							:class="{ selectable: isSelectable(value), selected: selection.includes(value.filename) }"
							@click="onElemClick(value)">
							<td>
								<span :class="{ icon: true, ...getElemTypeClass(value) }" />
							</td>
							<td :style="''">
								<div>
									{{ value.basename }}
								</div>
							</td>
							<td :style="''">
								<div>
									{{ myHumanFileSize(value.size, true) }}
								</div>
							</td>
							<td :style="''">
								<div>
									{{ lastModFormat(value.lastmod_ts) }}
								</div>
							</td>
						</tr>
					</tbody>
				</v-table>
				<EmptyContent v-else-if="connected" icon="icon-folder" class="empty-content"
					:style="cssVars">
					This directory is empty
				</EmptyContent>
				<EmptyContent v-else icon="icon-disabled-user" class="empty-content">
					File picker is not connected
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
						:val="quotaPercent"
						:text="quotaText" />
					<button v-if="selection.length > 0"
						@click="selectNone">
						Select none
					</button>
					<button v-if="selection.length < currentFiles.length"
						@click="selectAll">
						Select all
					</button>

					<button v-if="canValidate" id="validate" @click="onValidate">
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
import Modal from '@nextcloud/vue/dist/Components/Modal'
import EmptyContent from '@nextcloud/vue/dist/Components/EmptyContent'
import ProgressBar from 'vue-simple-progress'
import {
	dirname,
	basename,
	// encodePath,
	// isSamePath,
	// joinPaths,
} from '@nextcloud/paths'
import Breadcrumb from '@nextcloud/vue/dist/Components/Breadcrumb'
import Breadcrumbs from '@nextcloud/vue/dist/Components/Breadcrumbs'
import { addCustomEventListener, humanFileSize, colorOpacity, colorLuminance } from '../utils'

import Vue from 'vue'
import SmartTable from 'vuejs-smart-table'
Vue.use(SmartTable)

export default {
	name: 'NcFilePicker',

	components: {
		Modal,
		Breadcrumb,
		Breadcrumbs,
		ProgressBar,
		EmptyContent,
	},

	props: {
		ncUrl: {
			type: String,
			required: true,
		},
		ncLogin: {
			type: String,
			default: '',
		},
		ncPassword: {
			type: String,
			default: '',
		},
		multiple: {
			type: Boolean,
			default: true,
		},
		getTitle: {
			type: String,
			default: null,
		},
		putTitle: {
			type: String,
			default: null,
		},
		// theming
		themeColor: {
			type: String,
			default: '#0082c9',
			validator: (value) => {
				return value.match(/^#[0-9a-fA-F]{6}$/)
			},
		},
		// toggle buttons
		enableGetFilesPath: {
			type: Boolean,
			default: true,
		},
		enableGetFilesLink: {
			type: Boolean,
			default: true,
		},
		enableDownloadFiles: {
			type: Boolean,
			default: true,
		},
		enableGetSaveFilePath: {
			type: Boolean,
			default: true,
		},
		enableGetUploadFileLink: {
			type: Boolean,
			default: true,
		},
		enableOpenFileInput: {
			type: Boolean,
			default: true,
		},
	},

	data() {
		return {
			// initialize values with props
			login: this.ncLogin,
			password: this.ncPassword,
			url: this.ncUrl,
			mainColor: this.themeColor,
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
			// modes : getFilesPath, downloadFiles, getFilesLink, getSaveFilePath, uploadFiles, getUploadFileLink
			mode: '',
			loginWindow: null,
			filesToUpload: [],
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
			}
		},
		mainColorLight() {
			return colorOpacity(this.mainColor, 0.4)
		},
		mainColorLighter() {
			return colorOpacity(this.mainColor, 0.2)
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
				if (this.multiple) {
					return this.getTitle || 'Select some files'
				} else {
					return this.getTitle || 'Select a file'
				}
			} else if (['getSaveFilePath', 'uploadFiles', 'getUploadFileLink'].includes(this.mode)) {
				return this.putTitle || 'Choose a target directory'
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
				return this.quota.available === 'unlimited'
					? 0
					: parseInt(this.quota.used / this.quota.available * 100)
			} else {
				return 0
			}
		},
		quotaText() {
			return this.myHumanFileSize(this.quota.used, true) + ' used (' + this.quotaPercent + ' %)'
		},
		validateButtonText() {
			if (['getFilesPath', 'getFilesLink', 'downloadFiles'].includes(this.mode)) {
				const nbSelected = this.selection.length
				return `Get ${nbSelected} selected files`
			} else if (['getSaveFilePath', 'getUploadFileLink'].includes(this.mode)) {
				return `Save to ${basename(this.currentPath) || '/'}`
			} else if (['uploadFiles'].includes(this.mode)) {
				const nbToUpload = this.filesToUpload.length
				return `Upload ${nbToUpload} files to ${basename(this.currentPath) || '/'}`
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
		themeColor() {
			this.setMainColor(this.themeColor)
		},
	},

	mounted() {
		addCustomEventListener('.crumb a', 'click', this.hashChange)
	},

	methods: {
		updateUrl(newValue) {
			this.client = null
			this.connected = false
			this.url = newValue
			// set login/passwd to props values again
			this.login = this.ncLogin
			this.password = this.ncPassword
		},
		updateLogin(newValue) {
			this.client = null
			this.connected = false
			this.login = newValue

			this.url = this.ncUrl
			this.password = this.ncPassword
		},
		updatePassword(newValue) {
			this.client = null
			this.connected = false
			this.password = newValue

			this.login = this.ncLogin
			this.url = this.ncUrl
		},
		setMainColor(color) {
			this.mainColor = color
		},
		createClient() {
			// reset
			this.currentElements = []
			this.currentPath = '/'

			if (this.login && this.password) {
				this.client = createClient(
					this.davUrl + '/' + this.login, {
						username: this.login,
						password: this.password,
					}
				)
				this.updateWebdavQuota()
				this.getFolderContent()
			} else {
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
			this.updateWebdavQuota()
			this.getFolderContent()
		},
		async getFolderContent(path = null) {
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
				}
				this.loadingDirectory = false
			}
		},
		close() {
			this.isOpen = false
		},
		onElemClick(e) {
			if (this.loadingDirectory || this.uploadingFiles || this.downloadingFiles) {
				return
			}
			if (e.type === 'directory') {
				this.getFolderContent(e.filename)
			} else {
				if (this.multiple) {
					if (this.selection.includes(e.filename)) {
						this.selection.splice(this.selection.indexOf(e.filename), 1)
					} else {
						this.selection.push(e.filename)
					}
				} else {
					if (this.selection.includes(e.filename)) {
						this.selection = []
					} else {
						this.selection = [e.filename]
					}
				}
			}
		},
		selectNone() {
			this.selection = []
		},
		selectAll() {
			this.currentElements.forEach((e) => {
				if (e.type === 'file' && !this.selection.includes(e.filename)) {
					this.selection.push(e.filename)
				}
			})
		},
		onValidate() {
			if (this.mode === 'uploadFiles') {
				console.debug('upload to ' + this.currentPath)
				console.debug(this.filesToUpload)
				this.webdavUploadFiles()
			} else if (this.mode === 'getFilesPath') {
				console.debug('get file path in ' + this.currentPath)
				// const downloadLink = this.client.getFileDownloadLink(element)
				// for parent component
				this.$emit('get-files-path', this.selection)
				// for potential global listener
				const event = new CustomEvent('get-files-path', { detail: this.selection })
				document.dispatchEvent(event)
				this.close()
			} else if (this.mode === 'getFilesLink') {
				console.debug('get files link in ' + this.currentPath)
				const links = this.selection.map((path) => {
					return this.client.getFileDownloadLink(path)
				})
				// for parent component
				this.$emit('get-files-link', links)
				// for potential global listener
				const event = new CustomEvent('get-files-link', { detail: links })
				document.dispatchEvent(event)
				this.close()
			} else if (this.mode === 'getSaveFilePath') {
				console.debug('user wants to save in ' + this.currentPath)
				// for parent component
				this.$emit('get-save-file-path', this.currentPath)
				// for potential global listener
				const event = new CustomEvent('get-save-file-path', { detail: this.currentPath })
				document.dispatchEvent(event)
				this.close()
			} else if (this.mode === 'getUploadFileLink') {
				console.debug('user wants to get an upload link in ' + this.currentPath)
				const uploadPath = this.currentPath + '/file.txt'
				const uploadLink = this.client.getFileUploadLink(uploadPath)
				// for parent component
				this.$emit('upload-path-link-generated', this.currentPath, uploadLink)
				// for potential global listener
				const event = new CustomEvent('upload-path-link-generated', {
					detail: {
						link: uploadLink,
						targetDir: this.currentPath,
					},
				})
				document.dispatchEvent(event)
				this.close()
			} else if (this.mode === 'downloadFiles') {
				console.debug('user wants to download files')
				console.debug(this.selection)
				this.webdavDownload()
			}
		},
		async updateWebdavQuota() {
			if (this.client) {
				try {
					this.quota = await this.client.getQuota()
				} catch (error) {
					console.error(error)
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
			for (let i = 0; i < this.filesToUpload.length; i++) {
				const file = this.filesToUpload[i]
				console.debug(file)
				await this.client
					.putFileContents(this.currentPath + '/' + file.name, file, {
						overwrite: false,
						onUploadProgress: progress => {
							// console.debug(`Uploaded ${progress.loaded} bytes of ${progress.total}`)
							console.debug(`uploaded ${totalUploaded + progress.loaded} on ${totalSize}`)
							this.uploadProgress = parseInt((totalUploaded + progress.loaded) / totalSize * 100)
						},
					}).then(() => {
						console.debug('UPLOAD success' + file.name)
						totalUploaded += file.size
						this.uploadProgress = parseInt(totalUploaded / totalSize * 100)
						this.getFolderContent()
					}).catch(error => {
						console.error(error)
					})
			}
			// for parent component
			this.$emit('files-uploaded', this.currentPath, this.filesToUpload)
			// for potential global listener
			const event = new CustomEvent('files-uploaded', {
				detail: {
					targetDir: this.currentPath,
					files: this.filesToUpload,
				},
			})
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
				}
			}
			// for parent component
			this.$emit('files-downloaded', results)
			// for potential global listener
			const event = new CustomEvent('files-downloaded', { detail: results })
			document.dispatchEvent(event)
			this.close()
			this.downloadingFiles = false
			this.downloadProgress = 0
		},
		hashChange(event, elem) {
			event.preventDefault()
			event.stopPropagation()
			if (this.loadingDirectory || this.uploadingFiles || this.downloadingFiles) {
				return
			}
			const path = elem.getAttribute('href').replace('#', '')
			this.getFolderContent(path)
		},
		onFileInputChange(e) {
			this.filesToUpload = [...this.$refs.myFiles.files]
			this.uploadFiles()
		},
		myHumanFileSize(bytes, approx = false, si = false, dp = 1) {
			return humanFileSize(bytes, approx, si, dp)
		},
		lastModFormat(ts) {
			return moment.unix(ts).format('L HH:mm:ss')
		},
		isSelectable(elem) {
			return elem.type === 'directory' || ['getFilesPath', 'getFilesLink', 'downloadFiles'].includes(this.mode)
		},
		getElemTypeClass(elem) {
			if (elem.type === 'directory') {
				return { 'icon-folder': true }
			} else {
				const mime = elem.mime
				if (mime.match(/^video\//)) {
					return { 'icon-video': true }
				} else if (mime === 'text/calendar') {
					return { 'icon-calendar': true }
				} else if (mime === 'text/csv' || mime.match(/^application\/.*opendocument\.spreadsheet$/) || mime.match(/^application\/.*office.*sheet$/)) {
					return { 'icon-spreadsheet': true }
				} else if (mime.match(/^text\//)) {
					return { 'icon-text': true }
				} else if (mime.match(/^application\/pdf$/)) {
					return { 'icon-pdf': true }
				} else if (mime.match(/^application\/gpx/)) {
					return { 'icon-location': true }
				} else if (mime.match(/^image\//)) {
					return { 'icon-picture': true }
				} else if (mime.match(/^audio\//)) {
					return { 'icon-audio': true }
				} else if (mime.match(/^application\/.*opendocument\.text$/) || mime.match(/^application\/.*word.*document$/)) {
					return { 'icon-office-document': true }
				} else if (mime.match(/^application\/.*opendocument\.presentation$/) || mime.match(/^application\/.*office.*presentation$/)) {
					return { 'icon-office-presentation': true }
				}
				return { 'icon-file': true }
			}
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
		background: white;
		display: flex;
		flex-direction: column;
		padding: 20px;

		font-weight: normal;
		font-size: 0.875em;
		font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Cantarell,Ubuntu,'Helvetica Neue',Arial,'Noto Color Emoji',sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol';

		.rotate {
			animation: rotation 2s infinite linear;
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
			background-color: var(--main-color, grey);

			&:hover {
				background-color: black;
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

		button {
			padding: 10px;
			font-weight: bold;
			border-radius: 100px;
			border: 1px solid lightgrey;
		}

		.footer {
			display: flex;
		}

		.quota {
			width: 150px;
			margin: 20px 20px 0 0;
		}

		.breadcrumb {
			.crumb {
				>a {
					padding: 12px;
					text-decoration: none;
					color: grey;
				}

				.icon {
					margin-top: -6px;
					top: 2px;
					position: relative;
					opacity: 0.4;
				}

				&::before {
					color: #dbdbdb;
				}
			}
		}
	}

	.icon {
		min-width: 16px;
		min-height: 16px;
		display: inline-block;
	}
	.icon-close {
		background-image: url('./../../img/close.svg');
	}
	.icon-home {
		background-image: url('./../../img/home.svg');
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
	.icon-file {
		background-image: url('./../../img/file.svg');
	}
	.icon-video {
		background-image: url('./../../img/video.svg');
	}
	.icon-audio {
		background-image: url('./../../img/audio.svg');
	}
	.icon-calendar {
		background-image: url('./../../img/calendar.svg');
		opacity: 0.4;
	}
	.icon-text {
		background-image: url('./../../img/text.svg');
	}
	.icon-spreadsheet {
		background-image: url('./../../img/spreadsheet.svg');
	}
	.icon-location {
		background-image: url('./../../img/location.svg');
	}
	.icon-picture {
		background-image: url('./../../img/picture.svg');
		opacity: 0.4;
	}
	.icon-pdf {
		background-image: url('./../../img/pdf.svg');
	}
	.icon-office-document {
		background-image: url('./../../img/office-document.svg');
	}
	.icon-office-presentation {
		background-image: url('./../../img/office-presentation.svg');
	}
	.icon-disabled-user {
		background-image: url('./../../img/disabled-user.svg');
		opacity: 0.4;
	}

	#element-table {
		width: 100%;
		height: 100%;
		overflow: scroll;
		display: block;
		border-spacing: 0;
		padding: 10px 0 10px 0;

		.icon {
			width: 100px;
			height: 50px;
			background-repeat: no-repeat;
			background-size: 30px;
			background-position: center;
		}

		th {
			text-align: left;
			height: 50px;
		}

		tr:not(:first-child) td {
			border-top: 1px solid #e3e3e3;
		}

		tr:not(.selectable) {
			opacity: 30%;
		}

		tr.selectable {
			&.selected:hover {
				background-color: var(--main-color-light);
			}

			&.selected {
				background-color: var(--main-color-lighter);
			}

			&:hover {
				background-color: #e3e3e3;
			}
		}

		td {
			border: 0;
		}
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
	}

	.empty-content {
		flex-grow: 1;
		color: lightgrey;

		.icon-folder {
			mask-size: 65px auto;
			-webkit-mask-size: 65px auto;
		}
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
