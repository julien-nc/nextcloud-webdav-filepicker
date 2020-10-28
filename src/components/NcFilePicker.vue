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
						<Breadcrumb title="Home" href="#/" />
						<Breadcrumb v-for="p in currentPathParts"
							:key="p.path"
							:title="p.name"
							:href="'#' + p.path" />
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
import { addCustomEventListener } from '../utils'

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
		ncLogin: {
			type: String,
			default: '',
		},
		ncPassword: {
			type: String,
			default: '',
		},
	},

	data() {
		return {
			login: this.ncLogin,
			password: this.ncPassword,
			url: this.ncUrl,
			client: null,
			isOpen: false,
			currentElements: [],
			currentPath: '/',
			// modes : getFilePath, downloadFile, getSaveFilePath
			mode: '',
			loginWindow: null,
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
				parts.push({
					name: basename(tmpPath),
					path: tmpPath,
				})
				tmpPath = dirname(tmpPath)
			}
			return parts.slice().reverse()
		},
	},

	watch: {
	},

	mounted() {
		addCustomEventListener('.crumb a', 'click', this.hashChange)
	},

	methods: {
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
		getFilePath() {
			this.mode = 'getFilePath'
			this.isOpen = true
			this.getFolderContent()
		},
		async getFolderContent(path = null) {
			if (path) {
				this.currentPath = path
			}
			if (this.client === null) {
				this.createClient()
			} else {
				const directoryItems = await this.client.getDirectoryContents(this.currentPath)
				this.currentElements = directoryItems
				// console.debug(directoryItems)
			}
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

			this.close()
		},
		onUp() {
			console.debug('we are at ' + this.currentPath)
			console.debug('go up to ' + (dirname(this.currentPath) || '/'))
			this.getFolderContent(dirname(this.currentPath) || '/')
		},
		hashChange(event, elem) {
			event.preventDefault()
			event.stopPropagation()
			const path = elem.getAttribute('href').replace('#', '')
			this.getFolderContent(path)
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
	width: 900px;
	height: 800px;
	background: white;
}

::v-deep .breadcrumb {
	.crumb {
		>a {
			padding: 12px;
		}
	}
}

::v-deep .icon-home {
	min-width: 16px;
	min-height: 16px;
	background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDE2IDE2IiBoZWlnaHQ9IjE2IiB3aWR0aD0iMTYiPjxwYXRoIGQ9Im04IDFsLTggOGgzdjZoMTB2LTZoM2wtMy0zdi00aC0zdjFsLTItMnoiIGZpbGw9IiMwMDAiLz48L3N2Zz4K);
}
</style>
