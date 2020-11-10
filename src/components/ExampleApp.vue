<template>
	<div id="example-app">
		<h2>
			This page is an example Vue application using the file picker component.
			<br>
			<img src="https://vuejs.org/images/logo.png" width="25px" style="margin-bottom: -2px;"> 🚀
			Checkout the <a href="https://github.com/eneiluj/nextcloud-webdav-filepicker/blob/master/src/exampleVue.js">source file</a>
		</h2>
		<p>
			You can try the file picker with your Nextcloud instance from this page.
			<br>
			Make sure you installed the
			<a href="https://apps.nextcloud.com/apps/webapppassword">WebAppPassword app</a>
			and added <b>{{ domainToAuthorize }}</b> as allowed origin in WebAppPassword settings.
		</p>
		<br>
		<p>
			Following fields are directly plugged to NcFilePicker component's props.
		</p>
		<h3>Authentication</h3>
		<p>
			Leave login, password and token fields empty to let the file picker open an authentication popup and get an app password (web login flow).
		</p>
		<input v-model="ncUrl" type="text" placeholder="Nextcloud address">
		<input v-model="login" type="text" placeholder="login">
		<input v-model="password" type="password" placeholder="password">
		<input v-model="accessToken" type="password" placeholder="OAuth2 access token">
		<h3>Theme color</h3>
		<label for="color">Main file picker color</label>
		<input id="color" v-model="color" type="color">
		<h3>Custom button to open the file picker in "getFilesPath" mode</h3>
		<button @click="onCustomButtonClick">
			My custom button to select files
		</button>
		<h3>
			File picker component
		</h3>
		<p>
			NcFilePicker component is placed under the following line. It shows every button by default.
		</p>
		<hr>
		<NcFilePicker
			:nc-url="ncUrl"
			:nc-login="login"
			:nc-password="password"
			:nc-access-token="accessToken"
			:theme-color="color"
			:picker-mode="pickerMode"
			:picker-is-open="pickerIsOpen"
			@closed="onPickerClosed"
			@files-downloaded="onFilesDownloaded"
			@files-uploaded="onFilesUploaded"
			@get-save-file-path="onGetSaveFilePath"
			@upload-path-link-generated="onUploadPathLinkGenerated"
			@get-files-link="onGetFilesLink"
			@get-files-path="onGetFilesPath">
			<template #get-files-link>
				<button style="background-color: #eeffee;">
					🔗 Custom button passed via a slot, get files links
				</button>
			</template>
		</NcFilePicker>
		<hr>
		<p v-for="(line, i) in resultLines" :key="i">
			{{ line }}
		</p>
		<div class="ribbon">
			<a href="https://github.com/eneiluj/nextcloud-webdav-filepicker" target="_blank">Repository and documentation</a>
		</div>
	</div>
</template>

<script>
import NcFilePicker from './NcFilePicker'

export default {
	name: 'ExampleApp',

	components: {
		NcFilePicker,
	},

	props: [],

	data() {
		return {
			ncUrl: 'https://localhost/dev/server',
			login: '',
			password: '',
			accessToken: '',
			color: '#0082c9',
			pickerMode: null,
			pickerIsOpen: false,
			domainToAuthorize: window.location.protocol + '//' + window.location.host,
			resultLines: [],
		}
	},

	computed: {
	},

	watch: {
	},

	mounted() {
		const uri = window.location.search.substring(1)
		const params = new URLSearchParams(uri)
		const login = params.get('login')
		if (login) {
			this.login = login
		}
		const password = params.get('password')
		if (password) {
			this.password = password
		}
		const accessToken = params.get('accessToken')
		if (accessToken) {
			this.accessToken = accessToken
		}
		const url = params.get('url')
		if (url) {
			this.ncUrl = url
		}
		const color = params.get('color')
		if (color) {
			this.color = '#' + color
		}
	},

	methods: {
		onCustomButtonClick() {
			this.pickerMode = 'getFilesPath'
			this.pickerIsOpen = true
		},
		onPickerClosed() {
			this.pickerIsOpen = false
			this.pickerMode = null
		},
		onGetFilesPath(e) {
			console.debug('something was selected')
			console.debug(e)
			this.resultLines = ['File paths:']
			e.forEach((l) => {
				this.resultLines.push(l)
			})
		},
		onGetFilesLink(webdavLinks, pathList, ocsUrl) {
			console.debug('links were generated')
			console.debug(webdavLinks)
			this.resultLines = ['File links:']
			webdavLinks.forEach((l) => {
				this.resultLines.push(l)
			})
			this.resultLines.push('Path list:')
			pathList.forEach((path) => {
				this.resultLines.push(path)
			})
			this.resultLines.push('OCS URL:')
			this.resultLines.push(ocsUrl)
		},
		onGetSaveFilePath(e) {
			console.debug('This target directory was selected')
			console.debug(e)
			this.resultLines = ['This target directory was selected:', e]
		},
		onUploadPathLinkGenerated(targetDir, link) {
			console.debug('This upload link was generated')
			console.debug(link)
			this.resultLines = [`Upload link to ${targetDir}:`, link]
		},
		onFilesUploaded(targetDir, successFiles, errorFiles) {
			console.debug('Files were uploaded')
			console.debug(successFiles)
			console.debug(errorFiles)
			this.resultLines = []
			if (successFiles.length > 0) {
				this.resultLines.push(`These files were uploaded in ${targetDir}:`)
				successFiles.forEach(file => {
					this.resultLines.push(file.name)
				})
			}
			if (errorFiles.length > 0) {
				this.resultLines.push('!!! Those files could not be uploaded:')
				errorFiles.forEach(file => {
					this.resultLines.push(file.name)
				})
			}
		},
		onFilesDownloaded(files) {
			console.debug('something was downloaded')
			this.resultLines = ['Downloaded files:']
			files.forEach(file => {
				console.debug('File : ' + file.name)
				console.debug(file)
				const reader = new FileReader()
				reader.readAsText(file)
				reader.onload = () => {
					console.debug(reader.result)
					this.resultLines.push('File ' + file.name + ': ' + reader.result.slice(0, 100) + '...')
				}
				reader.onerror = () => {
					console.error('Impossible to read downloaded file')
					console.debug(reader.error)
				}
			})
		},
	},
}
</script>

<style scoped lang="scss">
#example-app {
	width: 100%;
}

.ribbon {
	background-color: #0082c9;
	overflow: hidden;
	white-space: nowrap;
	position: fixed;
	right: -70px;
	top: 75px;
	-webkit-transform: rotate(45deg);
	-moz-transform: rotate(45deg);
	-ms-transform: rotate(45deg);
	-o-transform: rotate(45deg);
	transform: rotate(45deg);
	-webkit-box-shadow: 0 0 10px #888;
	-moz-box-shadow: 0 0 10px #888;
	box-shadow: 0 0 10px #888;

	a {
		border: 1px solid #faa;
		color: #fff;
		display: block;
		font: bold 100% 'Helvetica Neue', Helvetica, Arial, sans-serif;
		margin: 1px 0;
		padding: 10px 50px;
		text-align: center;
		text-decoration: none;
		text-shadow: 0 0 5px #444;
	}
}
</style>
