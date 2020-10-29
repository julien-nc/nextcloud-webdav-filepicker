<template>
	<div id="example-app">
		<h2>This is an example Vue application</h2>
		<input v-model="ncUrl" type="text">
		<input v-model="login" type="text">
		<input v-model="password" type="password">
		<hr>
		<NcFilePicker
			:nc-url="ncUrl"
			:nc-login="login"
			:nc-password="password"
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
			login: 'julien',
			password: 'Nm8cC-kHczM-HGz55-S9SE2-Frf4F',
		}
	},

	computed: {
	},

	watch: {
	},

	mounted() {
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
