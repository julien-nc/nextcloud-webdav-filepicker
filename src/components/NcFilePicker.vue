<template>
	<div>
		<button
			@click="getFilePath">
			select file
		</button>
		<Modal v-if="isOpen" @close="close">
			<div class="modal__content">
				<div class="bread-container">
					<Breadcrumbs>
						<Breadcrumb title="Home" />
						<Breadcrumb v-for="p in currentPathParts"
							:key="p.path"
							:title="p.name"
							:href="p.path" />
					</Breadcrumbs>
				</div>
				<button @click="onUp">
					Up
				</button>
				<p v-for="e in currentElements"
					:key="e.filename"
					@click="onElemClick(e)">
					name : {{ e.filename }} size : {{ e.size }}
				</p>
				<button @click="onValidate">
					OK
				</button>
			</div>
		</Modal>
	</div>
</template>

<script>
import { createClient } from 'webdav/web'
import Modal from '@nextcloud/vue/dist/Components/Modal'
import {
	dirname,
	basename,
	// encodePath,
	// isSamePath,
	// joinPaths,
} from '@nextcloud/paths'
import Breadcrumb from '@nextcloud/vue/dist/Components/Breadcrumb'
import Breadcrumbs from '@nextcloud/vue/dist/Components/Breadcrumbs'

export default {
	name: 'NcFilePicker',

	components: {
		Modal,
		Breadcrumb,
		Breadcrumbs,
	},

	props: {
		ncUrl: {
			type: String,
			required: true,
		},
		login: {
			type: String,
			default: '',
		},
		password: {
			type: String,
			default: '',
		},
	},

	data() {
		return {
			client: null,
			isOpen: false,
			currentElements: [],
			currentPath: '/',
			// modes : getFilePath, downloadFile, getSaveFilePath
			mode: '',
		}
	},

	computed: {
		authUrl() {
			return this.ncUrl + '/index.php/apps/webapppassword'
		},
		davUrl() {
			return this.ncUrl + '/remote.php/dav/files'
		},
		currentPathParts() {
			const parts = []
			let tmpPath = this.currentPath
			while (tmpPath && tmpPath !== '/') {
				parts.push(basename(tmpPath))
				tmpPath = dirname(tmpPath)
			}
			return parts.map((p) => {
				return {
					path: p,
					name: basename(p),
				}
			}).slice().reverse()
		},
	},

	watch: {
	},

	mounted() {
		this.client = createClient(
			this.davUrl + '/' + this.login, {
				username: this.login,
				password: this.password,
			}
		)
	},

	methods: {
		getFilePath() {
			this.mode = 'getFilePath'
			this.isOpen = true
			this.getFolderContent()
		},
		async getFolderContent(path = null) {
			if (path) {
				this.currentPath = path
			}
			const directoryItems = await this.client.getDirectoryContents(this.currentPath)
			this.currentElements = directoryItems
			// console.debug(directoryItems)
		},
		close() {
			this.isOpen = false
		},
		onElemClick(e) {
			if (e.type === 'directory') {
				this.getFolderContent(e.filename)
			}
		},
		onValidate() {
			// for parent component
			this.$emit('pathSelected', this.currentElements[0])

			// for potential global listener
			const event = new CustomEvent('pathSelected', { detail: this.currentElements[0] })
			document.dispatchEvent(event)
		},
		onUp() {
			console.debug('we are at ' + this.currentPath)
			console.debug('go up to ' + (dirname(this.currentPath) || '/'))
			this.getFolderContent(dirname(this.currentPath) || '/')
		},
	},
}
</script>

<style scoped lang="scss">
.bread-container {
	display: inline-flex;
	width: 100%;
}

.modal__content {
	background: white;
}
</style>
