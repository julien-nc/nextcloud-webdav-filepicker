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
		<input v-model="ncUrl" type="text" placeholder="Nextcloud address">
		<input v-model="login" type="text" placeholder="login">
		<input v-model="password" type="password" placeholder="password">
		<input v-model="color" type="color">
		<hr>
		<NcFilePicker
			:nc-url="ncUrl"
			:nc-login="login"
			:nc-password="password"
			:theme-color="color"
			@filesDownloaded="onFilesDownloaded"
			@filesUploaded="onFilesUploaded"
			@getSaveFilePath="onGetSaveFilePath"
			@uploadPathLinkGenerated="onUploadPathLinkGenerated"
			@getFilesLink="onGetFilesLink"
			@getFilesPath="onGetFilesPath" />
	</div>
</template>

<script>
// import axios from '@nextcloud/axios'
// import { delay } from '../utils'
// import { showSuccess, showError } from '@nextcloud/dialogs'

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
			color: '#ff9b00',
			domainToAuthorize: window.location.protocol + '//' + window.location.host,
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
	},

	methods: {
		onGetFilesPath(e) {
			console.debug('something was selected')
			console.debug(e)
		},
		onGetFilesLink(e) {
			console.debug('links were retreived')
			console.debug(e)
		},
		onGetSaveFilePath(e) {
			console.debug('This target directory was selected')
			console.debug(e)
		},
		onUploadPathLinkGenerated(e) {
			console.debug('This upload link was generated')
			console.debug(e)
		},
		onFilesUploaded(e) {
			console.debug('Files were uploaded')
			console.debug(e)
		},
		onFilesDownloaded(files) {
			console.debug('something was downloaded')
			files.forEach(file => {
				console.debug('File : ' + file.name)
				console.debug(file)
				const reader = new FileReader()
				reader.readAsText(file)
				reader.onload = function() {
					console.debug(reader.result)
				}
				reader.onerror = function() {
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
