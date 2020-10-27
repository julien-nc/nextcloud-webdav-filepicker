<template>
	<div id="example-app">
		This is an example Vue application
		<NcFilePicker
			nc-url="https://localhost/dev/server"
			login="julien"
			password="Nm8cC-kHczM-HGz55-S9SE2-Frf4F"
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
