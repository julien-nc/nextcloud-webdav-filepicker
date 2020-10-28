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
				<v-table id="element-table"
					:data="sortedCurrentElements">
					<thead slot="head">
						<th />
						<v-th sort-key="basename">
							File name
						</v-th>
						<v-th sort-key="size">
							Size
						</v-th>
						<v-th sort-key="lastmod">
							Modified
						</v-th>
					</thead>
					<tbody slot="body" slot-scope="{displayData}">
						<tr v-for="value in displayData"
							:key="value.filename"
							@click="onElemClick(value)">
							<td>
								<span :class="{ icon: true, 'icon-folder': value.type === 'directory', 'icon-file': value.type !== 'directory' }" />
							</td>
							<td :style="''">
								<div>
									{{ value.basename }}
								</div>
							</td>
							<td :style="''">
								<div>
									{{ value.size }}
								</div>
							</td>
							<td :style="''">
								<div>
									{{ value.lastmod }}
								</div>
							</td>
						</tr>
					</tbody>
				</v-table>
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

import Vue from 'vue'
import SmartTable from 'vuejs-smart-table'
Vue.use(SmartTable)

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
		sortedCurrentElements() {
			return this.currentElements.slice().sort((a, b) => {
				return a.basename.toLowerCase() > b.basename.toLowerCase()
			})
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
				console.debug(directoryItems)
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

::v-deep .modal-container {
	display: flex !important;
	min-height: 80%;
}

.modal__content {
	width: 900px;
	// height: 800px;
	background: white;
	display: flex;
	flex-direction: column;
	padding: 20px;
}

::v-deep .breadcrumb {
	.crumb {
		>a {
			padding: 12px;
		}
	}
}

::v-deep .icon {
	min-width: 16px;
	min-height: 16px;
	display: inline-block;
}

::v-deep .icon-home {
	background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDE2IDE2IiBoZWlnaHQ9IjE2IiB3aWR0aD0iMTYiPjxwYXRoIGQ9Im04IDFsLTggOGgzdjZoMTB2LTZoM2wtMy0zdi00aC0zdjFsLTItMnoiIGZpbGw9IiMwMDAiLz48L3N2Zz4K);
}

::v-deep .icon-folder {
	background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiIgd2lkdGg9IjE2IiB2ZXJzaW9uPSIxLjEiIGhlaWdodD0iMTYiPjxwYXRoIGZpbGw9IiMwMDgyYzkiIGQ9Im0xLjUgMmMtMC4yNSAwLTAuNSAwLjI1LTAuNSAwLjV2MTFjMCAwLjI2IDAuMjQgMC41IDAuNSAwLjVoMTNjMC4yNiAwIDAuNS0wLjI0MSAwLjUtMC41di05YzAtMC4yNS0wLjI1LTAuNS0wLjUtMC41aC02LjVsLTItMnoiLz48L3N2Zz4K);
}

::v-deep .icon-file {
	background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgd2lkdGg9IjE2IiB2ZXJzaW9uPSIxLjEiPjxwYXRoIGZpbGw9IiM5Njk2OTYiIGQ9Im0yLjUgMWMtMC4yOCAwLTAuNSAwLjIyLTAuNSAwLjV2MTNjMCAwLjI4IDAuMjIgMC41IDAuNSAwLjVoMTFjMC4yOCAwIDAuNS0wLjIyIDAuNS0wLjV2LTEwLjVsLTMtM3oiLz48L3N2Zz4K);
}

#element-table {
	width: 100%;
	height: 100%;
	overflow: scroll;
	display: block;
	border-spacing: 0;

	.icon {
		width: 100px;
		height: 50px;
		background-repeat: no-repeat;
		background-size: 50px;
		background-position: center;
	}

	th {
		text-align: left;
	}

	tr:hover {
		background-color: lightgrey;
	}

	td {
		border: 0;
	}
}

</style>
