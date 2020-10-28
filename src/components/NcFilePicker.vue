<template>
	<div>
		<button
			@click="getFilePath">
			select file
		</button>
		<input
			id="file-input"
			ref="myFiles"
			type="file"
			multiple
			@change="onFileInputChange">
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
				<v-table v-if="!loadingDirectory && currentElements.length > 0"
					id="element-table"
					:data="sortedCurrentElements">
					<thead slot="head">
						<th style="width: 10%;" />
						<v-th sort-key="basename" style="width: 50%;">
							File name
						</v-th>
						<v-th sort-key="size" style="width: 15%;">
							Size
						</v-th>
						<v-th sort-key="lastmod_ts" style="width: 25%;">
							Modified
						</v-th>
					</thead>
					<tbody slot="body" slot-scope="{displayData}">
						<tr v-for="value in displayData"
							:key="value.filename"
							:class="{ selected: selection.includes(value.filename) }"
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
									{{ myHumanFileSize(value.size, true) }}
								</div>
							</td>
							<td :style="''">
								<div>
									{{ lastModFormat(value.lastmod_ts) }}
								</div>
							</td>
						</tr>
					</tbody>
				</v-table>
				<div v-else-if="loadingDirectory" class="loading">
					Loading...
				</div>
				<button id="validate" @click="onValidate">
					OK
				</button>
			</div>
		</Modal>
	</div>
</template>

<script>
import { createClient } from 'webdav/web'
import moment from '@nextcloud/moment'
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
import { addCustomEventListener, humanFileSize } from '../utils'

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
			selection: [],
			loadingDirectory: false,
			// modes : getFilePath, downloadFile, getSaveFilePath, uploadFiles
			mode: '',
			loginWindow: null,
			filesToUpload: [],
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
		uploadFiles() {
			this.mode = 'uploadFiles'
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
				this.selection = []
				this.loadingDirectory = true
				const directoryItems = await this.client.getDirectoryContents(this.currentPath)
				this.currentElements = directoryItems.map((el) => {
					return {
						...el,
						lastmod_ts: moment(el.lastmod).unix(),
					}
				})
				console.debug(this.currentElements)
				this.loadingDirectory = false
				// const m = moment(directoryItems[0].lastmod)
				// console.debug(m.format('LLL'))
				// console.debug(m)
				// console.debug(directoryItems[0].lastmod)
			}
		},
		close() {
			this.isOpen = false
		},
		onElemClick(e) {
			if (e.type === 'directory') {
				this.getFolderContent(e.filename)
			} else {
				if (this.selection.includes(e.filename)) {
					this.selection.splice(this.selection.indexOf(e.filename), 1)
				} else {
					this.selection.push(e.filename)
				}
			}
		},
		onValidate() {
			if (this.mode === 'uploadFiles') {
				console.debug('upload to ' + this.currentPath)
				console.debug(this.filesToUpload)
			} else if (this.mode === 'getFilePath') {
				console.debug('get file path in ' + this.currentPath)
				// for parent component
				this.$emit('pathSelected', this.selection)

				// for potential global listener
				const event = new CustomEvent('pathSelected', { detail: this.selection })
				document.dispatchEvent(event)
				this.close()
			}
		},
		hashChange(event, elem) {
			event.preventDefault()
			event.stopPropagation()
			const path = elem.getAttribute('href').replace('#', '')
			this.getFolderContent(path)
		},
		onFileInputChange(e) {
			this.filesToUpload = [...this.$refs.myFiles.files]
			this.uploadFiles()
		},
		myHumanFileSize(bytes, approx = false, si = false, dp = 1) {
			return humanFileSize(bytes, approx, si, dp)
		},
		lastModFormat(ts) {
			return moment.unix(ts).format('L HH:mm:ss')
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
	border-radius: 10px !important;
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
			text-decoration: none;
			color: grey;
		}

		.icon {
			margin-top: -6px;
			top: 2px;
			position: relative;
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
	padding: 10px 0 10px 0;

	.icon {
		width: 100px;
		height: 50px;
		background-repeat: no-repeat;
		background-size: 50px;
		background-position: center;
	}

	th {
		text-align: left;
		height: 50px;
	}

	tr {
		&.selected:hover {
			background-color: lightblue;
		}

		&.selected {
			background-color: lightcyan;
		}

		&:hover {
			background-color: lightgrey;
		}
	}

	td {
		border: 0;
	}
}

#validate {
	margin-left: auto;
}

.loading {
	flex-grow: 1;
	text-align: center;
	padding-top: 50px;
}
</style>
