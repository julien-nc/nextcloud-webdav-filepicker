<template>
	<div id="example-app">
		This is an example Vue application
		<NcFilePicker
			nc-url="https://ripley.minifox.fr/nc/n20git"
			login="julien"
			password="" />
	</div>
</template>

<script>
import axios from '@nextcloud/axios'
import { delay } from '../utils'
import { showSuccess, showError } from '@nextcloud/dialogs'

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
	},
}
</script>

<style scoped lang="scss">
#example-app {
	width: 100%;
}

</style>
