<template>
	<div id="example-app">
		<h2>This is an example Vue application using the file picker component.</h2>
		<p>
			Make sure you installed the
			<a href="https://apps.nextcloud.com/apps/webapppassword">WebAppPassword app</a>
			and added <b>{{ domainToAuthorize }}</b> as allowed origin in WebAppPassword settings.
		</p>
		<p>
			Leave login and password fields empty to let the file picker open an authentication popup and get a temporary app password.
		</p>
		<br>
		<p>
			These fields are directly plugged to NcFilePicker component's props.
		</p>
		<input v-model="ncUrl" type="text" placeholder="Nextcloud address">
		<input v-model="login" type="text" placeholder="login">
		<input v-model="password" type="password" placeholder="password">
		<input v-model="color" type="color">
		<p>
			NcFilePicker component is placed under this line.
		</p>
		<hr>
		<NcFilePicker
			:nc-url="ncUrl"
			:nc-login="login"
			:nc-password="password"
			:theme-color="color"
			@files-downloaded="onFilesDownloaded"
			@files-uploaded="onFilesUploaded"
			@get-save-file-path="onGetSaveFilePath"
			@upload-path-link-generated="onUploadPathLinkGenerated"
			@get-files-link="onGetFilesLink"
			@get-files-path="onGetFilesPath" />
		<hr>
		<p v-for="(line, i) in resultLines" :key="i">
			{{ line }}
		</p>
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
			color: '#0082c9',
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
		onGetFilesPath(e) {
			console.debug('something was selected')
			console.debug(e)
			this.resultLines = ['File paths:']
			e.forEach((l) => {
				this.resultLines.push(l)
			})
		},
		onGetFilesLink(e) {
			console.debug('links were retreived')
			console.debug(e)
			this.resultLines = ['File links:']
			e.forEach((l) => {
				this.resultLines.push(l)
			})
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
		onFilesUploaded(targetDir, files) {
			console.debug('Files were uploaded')
			console.debug(files)
			this.resultLines = [`These files were uploaded in ${targetDir}:`]
			files.forEach(file => {
				this.resultLines.push(file.name)
			})
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
</style>
