<template>
	<div id="example-app">
		<h2>This is an example Vue application</h2>
		<input v-model="ncUrl" type="text">
		<input v-model="login" type="text">
		<input v-model="password" type="password">
		<hr>
		<NcFilePicker
			:nc-url="ncUrl"
			:login="login"
			:password="password"
			@pathSelected="onPathSelected" />
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
		onPathSelected(e) {
			console.debug('something was selected')
			console.debug(e)
		},
	},
}
</script>

<style scoped lang="scss">
#example-app {
	width: 100%;
}

</style>
