<template>
	<div class="picker__content">
		<div class="picker__header">
			<h2>
				{{ title }}
			</h2>
			<span v-show="downloadingFiles || uploadingFiles"
				:class="{ icon: true, 'loading-custom': true, rotate: true, dark: darkMode }" />
			<div v-if="connected && mode === 'getFilesLink'" class="share-link-searcher">
				<div class="spacer" />
			</div>
			<div class="search-container">
				<div v-if="showSearch">
					<PickerSearch
						initial-search-text=""
						:disabled="loadingDirectory || uploadingFiles || downloadingFiles"
						@do-search="onDoSearch" />
				</div>
			</div>
			<button class="closeButton"
				@click="$emit('close')">
				<span class="icon icon-close" />
			</button>
		</div>
		<div class="bread-container">
			<PickerBreadcrumbs
				:parts="currentPathParts"
				:disabled="loadingDirectory || uploadingFiles || downloadingFiles"
				@hash-changed="onBreadcrumbChange" />
		</div>
		<span v-if="loadingDirectory"
			:class="{ icon: true, 'loading-custom': true, rotate: true, dark: darkMode, 'loading-custom-main': true }" />
		<FileBrowser v-else-if="connected && currentElements.length > 0"
			id="file-browser"
			:elements="sortedCurrentElements"
			:forced-selection="selection"
			:can-select-files="['getFilesPath', 'getFilesLink', 'downloadFiles'].includes(mode)"
			:multiple-select="multipleDownload"
			:disabled="loadingDirectory || uploadingFiles || downloadingFiles"
			:searching-mode="searching"
			@folder-clicked="$emit('folder-clicked', $event)"
			@selection-changed="onSelectionChange">
			<template #file-icon="{node}">
				<slot name="file-icon" :node="node" />
			</template>
		</FileBrowser>
		<NcEmptyContent v-else-if="connected"
			:title="t('filepicker', 'This folder is empty')"
			class="empty-content">
			<template #icon>
				<FolderIcon />
			</template>
		</NcEmptyContent>
		<NcEmptyContent v-else
			:title="t('filepicker', 'Not connected')"
			class="empty-content">
			<template #icon>
				<AccountOffIcon />
			</template>
		</NcEmptyContent>
		<small v-if="searching && currentElements.length >= 20">
			{{ t('filepicker', 'Current search results are limited to 20 results, narrow your search please.') }}
		</small>
		<div v-if="connected && mode === 'getFilesLink'" class="share-link-settings footer">
			<div class="spacer" />
			<div v-if="showLinkSettings">
				<span class="icon icon-password" />&nbsp;
				<input
					id="password-protect"
					v-model="protectionPassword"
					:placeholder="t('filepicker', 'Password protect')"
					type="text">
			</div>
			<div v-if="showLinkSettings">
				<span class="icon icon-rename" />
				<input
					id="allow-edit"
					v-model="allowEdition"
					type="checkbox">
				<label for="allow-edit">
					{{ t('filepicker', 'Allow editing') }}&nbsp;
				</label>
			</div>
			<div v-if="showLinkSettings">
				<label v-if="expirationDate"
					for="expiration-datepicker">
					{{ t('filepicker', 'Expires on') }}&nbsp;
				</label>
				<MyDatetimePicker
					id="expiration-datepicker"
					v-model="expirationDate"
					:disabled-date="isDateDisabled"
					:placeholder="t('filepicker', 'Expires on')"
					:clearable="true" />
			</div>
			<div>
				<span class="icon icon-public" />
				<input
					id="link-settings"
					v-model="showLinkSettings"
					type="checkbox">
				<label for="link-settings">
					{{ t('filepicker', 'Link settings') }}&nbsp;
				</label>
			</div>
		</div>
		<ProgressBar v-if="uploadingFiles"
			size="medium"
			:val="uploadProgress"
			:max="100"
			:text="uploadProgress + '%'" />
		<ProgressBar v-if="downloadingFiles"
			size="medium"
			:val="downloadProgress"
			:max="100"
			:text="downloadProgress + '%'" />
		<div v-else class="footer">
			<button v-if="displayQuotaRefresh && quota"
				:title="t('filepicker', 'Update quota')"
				class="refreshQuotaButton"
				@click="$emit('refresh-quota')">
				<span v-if="quotaLoading"
					:class="{ icon: true, 'loading-custom': true, rotate: true, dark: darkMode }" />
				<RefreshIcon v-else />
			</button>
			<ProgressBar v-if="quota"
				size="small"
				class="quota"
				:val="quotaPercent"
				:max="100"
				:text="quotaText" />
			<div v-if="connected && ['getSaveFilePath', 'uploadFiles', 'getUploadFileLink'].includes(mode)"
				class="newDirectory">
				<button v-if="!namingNewDirectory"
					v-tooltip.top="{ content: t('filepicker', 'Create new folder'), popperClass: darkMode ? 'dark' : '' }"
					class="newDirectoryButton"
					@click="onCreateDirectory">
					<span class="icon icon-add" />
				</button>
				<div v-else
					class="newDirectoryForm">
					<input v-model="newDirectoryName"
						type="text"
						:placeholder="t('filepicker', 'New folder name')"
						@keyup.escape="onCancelNewDirectory"
						@keyup.enter="createDirectory">
					<button
						v-tooltip.top="{ content: t('filepicker', 'Cancel'), popperClass: darkMode ? 'dark' : '' }"
						class="newDirectoryButton"
						@click="onCancelNewDirectory">
						<span class="icon icon-history" />
					</button>
					<button
						v-tooltip.top="{ content: t('filepicker', 'Ok'), popperClass: darkMode ? 'dark' : '' }"
						class="newDirectoryButton"
						@click="createDirectory">
						<span class="icon icon-checkmark" />
					</button>
				</div>
			</div>
			<div v-if="showSelectNone || showSelectAll"
				class="allNoneButtons">
				<button v-if="showSelectNone"
					@click="selectNone">
					<span class="icon custom-icon icon-unchecked" />
					{{ t('filepicker', 'None') }}
				</button>
				<button v-if="showSelectAll"
					@click="selectAll">
					<span class="icon custom-icon icon-checked" />
					{{ t('filepicker', 'All') }}
				</button>
			</div>

			<div id="validate">
				<span v-if="connected && (selection.length > 0 || ['getFilesPath', 'downloadFiles', 'getFilesLink'].includes(mode))"
					class="nb-selected">
					{{ nbSelectedText }}
				</span>
				<button v-if="connected && canValidate"
					@click="onValidate">
					<span class="icon icon-checkmark" />
					<span class="button-text">
						{{ validateButtonText }}
					</span>
				</button>
			</div>
		</div>
	</div>
</template>

<script>
import RefreshIcon from 'vue-material-design-icons/Refresh.vue'
import FolderIcon from 'vue-material-design-icons/Folder.vue'
import AccountOffIcon from 'vue-material-design-icons/AccountOff.vue'

import PickerSearch from './PickerSearch.vue'
import PickerBreadcrumbs from './PickerBreadcrumbs.vue'
import FileBrowser from './FileBrowser.vue'
import MyDatetimePicker from './MyDatetimePicker.vue'
import { t, n } from '../translation.js'
import { humanFileSize } from '../utils.js'

import ProgressBar from 'vue-simple-progress'

import Tooltip from '@nextcloud/vue/dist/Directives/Tooltip.js'
import NcEmptyContent from '@nextcloud/vue/dist/Components/NcEmptyContent.js'
import { dirname, basename } from '@nextcloud/paths'

export default {
	name: 'FilePicker',

	components: {
		PickerSearch,
		PickerBreadcrumbs,
		FileBrowser,
		ProgressBar,
		NcEmptyContent,
		MyDatetimePicker,
		FolderIcon,
		AccountOffIcon,
		RefreshIcon,
	},

	directives: {
		tooltip: Tooltip,
	},

	props: {
		getTitle: {
			type: String,
			default: null,
		},
		putTitle: {
			type: String,
			default: null,
		},
		loadingDirectory: {
			type: Boolean,
			default: false,
		},
		uploadingFiles: {
			type: Boolean,
			default: false,
		},
		downloadingFiles: {
			type: Boolean,
			default: false,
		},
		darkMode: {
			type: Boolean,
			default: false,
		},
		currentPath: {
			type: String,
			default: null,
		},
		quota: {
			type: Object,
			default: () => {},
		},
		quotaLoading: {
			type: Boolean,
			default: false,
		},
		displayQuotaRefresh: {
			type: Boolean,
			default: false,
		},
		connected: {
			type: Boolean,
			default: true,
		},
		currentElements: {
			type: Array,
			default: () => [],
		},
		filesToUpload: {
			type: Array,
			default: () => [],
		},
		mode: {
			type: String,
			default: '',
		},
		multipleDownload: {
			type: Boolean,
			default: true,
		},
		uploadProgress: {
			type: Number,
			default: 0,
		},
		downloadProgress: {
			type: Number,
			default: 0,
		},
		showSearch: {
			type: Boolean,
			default: true,
		},
		searching: {
			type: Boolean,
			default: false,
		},
	},

	data() {
		return {
			t,
			n,
			selection: [],
			expirationDate: '',
			protectionPassword: '',
			allowEdition: false,
			showLinkSettings: false,
			// new dir
			namingNewDirectory: false,
			creatingDirectory: false,
			newDirectoryName: '',
		}
	},

	computed: {
		title() {
			if (['getFilesPath', 'downloadFiles', 'getFilesLink'].includes(this.mode)) {
				return this.multipleDownload
					? this.getTitle || t('filepicker', 'Select one or multiple files')
					: this.getTitle || t('filepicker', 'Select a file')
			} else if (['getSaveFilePath', 'uploadFiles', 'getUploadFileLink'].includes(this.mode)) {
				return this.putTitle || t('filepicker', 'Save to')
			}
			return ''
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
				return a.basename.toLowerCase().localeCompare(b.basename.toLowerCase())
			})
		},
		currentFiles() {
			return this.currentElements.filter((e) => {
				return e.type === 'file'
			})
		},
		quotaPercent() {
			if (this.quota?.used && this.quota?.available) {
				const available = parseInt(this.quota.available)
				const used = parseInt(this.quota.used)
				return (!isNaN(available) && available !== 0 && !isNaN(used))
					? parseInt(used / (available + used) * 100)
					: 0
			} else {
				return 0
			}
		},
		quotaText() {
			const used = parseInt(this.quota.used)
			if (!isNaN(used) && this.quota?.available) {
				const available = parseInt(this.quota.available)
				return (!isNaN(available) && available !== 0)
					? t('filepicker', '{size} used ({percent}% of {total})', { size: this.myHumanFileSize(used, true), percent: this.quotaPercent, total: this.myHumanFileSize(available + used, true) })
					: t('filepicker', '{size} used', { size: this.myHumanFileSize(used, true) })
			} else {
				return t('filepicker', 'invalid quota')
			}
		},
		showSelectNone() {
			return ['getFilesPath', 'getFilesLink', 'downloadFiles'].includes(this.mode) && this.selection.length > 0
		},
		showSelectAll() {
			return ['getFilesPath', 'getFilesLink', 'downloadFiles'].includes(this.mode) && this.selection.length < this.currentFiles.length
		},
		nbSelectedText() {
			const nbSelected = this.selection.length
			return this.n('filepicker', '{nbSelected} selected', '{nbSelected} selected', nbSelected, { nbSelected })
		},
		canValidate() {
			if (['getFilesPath', 'getFilesLink', 'downloadFiles'].includes(this.mode)) {
				return this.selection.length > 0
			} else if (this.mode === 'uploadFiles') {
				return this.filesToUpload.length > 0
			} else {
				return true
			}
		},
		validateButtonText() {
			if (['getFilesPath', 'getFilesLink', 'downloadFiles'].includes(this.mode)) {
				return t('filepicker', 'Ok')
			} else if (['getSaveFilePath', 'getUploadFileLink'].includes(this.mode)) {
				return t('filepicker', 'Save to {path}', { path: basename(this.currentPath) || '/' })
			} else if (['uploadFiles'].includes(this.mode)) {
				const nbToUpload = this.filesToUpload.length
				return this.n('filepicker', 'Upload {nbToUpload} file to {path}', 'Upload {nbToUpload} files to {path}', nbToUpload, { nbToUpload, path: basename(this.currentPath) || '/' })
			}
			return ''
		},
	},

	watch: {
		/**
		 * Reset selection when path changes
		 *
		 * @param {string} val new path
		 */
		currentPath(val) {
			this.selection = []
		},
	},

	mounted() {
	},

	methods: {
		onDoSearch(searchText, searchOptions) {
			this.$emit('search-text-submitted', searchText, searchOptions)
		},
		onBreadcrumbChange(path) {
			this.$emit('breadcrumb-hash-changed', path)
		},
		selectNone() {
			this.selection = []
			this.$emit('selection-changed', this.selection)
		},
		selectAll() {
			this.selection = this.currentElements.filter((e) => {
				return (e.type === 'file')
			}).map((e) => {
				return e.filename
			})
			this.$emit('selection-changed', this.selection)
		},
		onSelectionChange(newSelection) {
			this.selection = newSelection
			this.$emit('selection-changed', this.selection)
		},
		isDateDisabled(d) {
			const now = new Date()
			return d <= now
		},
		onCreateDirectory() {
			this.namingNewDirectory = true
		},
		onCancelNewDirectory() {
			this.namingNewDirectory = false
		},
		createDirectory() {
			this.$emit('create-directory', this.newDirectoryName)
			this.namingNewDirectory = false
			this.newDirectoryName = ''
		},
		myHumanFileSize(bytes, approx = false, si = false, dp = 1) {
			return humanFileSize(bytes, approx, si, dp)
		},
		onValidate() {
			if (this.mode === 'getFilesLink') {
				this.$emit('validate', {
					protectionPassword: this.protectionPassword,
					allowEdition: this.allowEdition,
					expirationDate: this.expirationDate,
				})
			} else {
				this.$emit('validate')
			}
		},
	},
}
</script>

<style scoped lang="scss">
.picker__content {
	width: 900px;
	// height: 800px;
	background: var(--color-main-background);
	color: var(--color-main-text);
	display: flex;
	flex-direction: column;
	padding: 20px;

	// font-weight: normal;
	font-size: var(--default-font-size);
	font-family: var(--font-face);

	.picker__header {
		display: flex;

		h2 {
			margin: 10px 0 10px 0;
			flex-grow: 1;
		}
	}

	.rotate {
		animation: rotation 2s infinite linear;
	}

	.loading-custom {
		margin-right: 10px;
		background: no-repeat center/30px url('../../img/loading.png');
		width: 44px;
		height: 44px;

		&.dark {
			filter: invert(100%);
			-webkit-filter: invert(100%);
		}
	}

	.loading-custom-main {
		width: 100%;
		height: 100%;
	}

	button {
		height: 44px;
		cursor: pointer;
		padding: 10px;
		font-weight: bold;
		border-radius: 100px;
		border: 1px solid lightgrey;
		background-color: var(--color-background-dark);
		color: var(--color-main-text);

		&:hover {
			border-color: var(--color-primary-element);
		}
	}

	.refreshQuotaButton {
		width: 44px;
		height: 44px;
		border: 0;
		background-color: var(--color-main-background);
		display: flex;
		align-items: center;
		justify-content: center;
		&:hover {
			background-color: var(--color-background-hover);
		}
		.icon {
			background-color: rgba(0, 0, 0, 0);
			margin: 0;
			background-size: 20px;
		}
	}

	.closeButton {
		width: 44px;
		height: 44px;
		margin: 0;
		border-radius: 50%;
		border: 0;
		background-color: var(--color-main-background);
		&:hover {
			background-color: var(--color-background-hover);
		}
		.icon {
			width: 16px;
		}
	}

	.newDirectoryButton {
		width: 44px;
		height: 44px;

		.icon {
			min-height: 14px;
		}
	}

	.bread-container {
		display: inline-flex;
	}

	.search-container {
		display: inline-flex;
		flex-direction: row-reverse;
	}

	.footer {
		display: flex;
		height: 44px;
		max-width: 860px;

		.allNoneButtons,
		.newDirectory {
			flex-grow: 1;
		}

		#validate {
			//margin-left: auto;
			max-width: 30%;
			display: flex;

			.nb-selected {
				margin: auto 10px auto 0;
				line-height: 44px;
				white-space: nowrap;
			}
			button {
				display: flex;
				align-items: center;
				width: 100%;
				.icon {
					margin: 0 1px 0 1px;
				}
				.button-text {
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
					margin: 0 5px 0 5px;
				}
			}
		}

		.quota {
			min-width: 150px;
			max-width: 250px;
			margin: 9px 20px 0 0;
			position: relative;
			bottom: -5px;
		}
	}

	#file-browser {
		border-bottom: 1px solid var(--color-border);
		margin-bottom: 5px;
	}
	.share-link-settings {
		height: 55px;
		min-height: 55px;

		> div {
			display: flex;
			margin-left: 25px;
			> * {
				margin: auto 2px auto 2px !important;
			}
		}
		.spacer {
			flex-grow: 1;
		}

		input[type=checkbox] {
			margin: auto 5px auto 5px;
		}
		#expiration-datepicker {
			width: 140px;
		}
		#password-protect {
			width: 140px;
		}
		label {
			cursor: pointer;
		}

		input[type=text] {
			-moz-appearance: textfield;
			-webkit-appearance: textfield;
			background-color: var(--color-main-background);
			color: var(--color-main-text);
			border: 1px solid lightgrey;
			border-radius: 3px;
			padding: 0px 6px;
			height: 34px;
		}
	}

	.share-link-settings .custom-icon,
	button .custom-icon {
		mask-size: 15px auto;
		mask-position: center;
		-webkit-mask-size: 15px auto;
		-webkit-mask-position: center;
		background-color: var(--color-main-text);
		// margin-bottom: -2px;
		width: 20px;
	}

	.icon-checked {
		mask: url('../../img/checked.svg') no-repeat;
		-webkit-mask: url('../../img/checked.svg') no-repeat;
	}
	.icon-unchecked {
		mask: url('../../img/unchecked.svg') no-repeat;
		-webkit-mask: url('../../img/unchecked.svg') no-repeat;
	}
}

::v-deep .icon-folder {
	mask: url('./../../img/folder.svg') no-repeat;
	mask-size: 30px auto;
	mask-position: center;
	-webkit-mask: url('./../../img/folder.svg') no-repeat;
	-webkit-mask-size: 30px auto;
	-webkit-mask-position: center;
	background-color: var(--color-primary-element, grey);
}

::v-deep .vue-simple-progress-bar {
	background: var(--color-primary-element-light) none repeat scroll 0% 0% !important;
}

::v-deep .vue-simple-progress-text {
	color: var(--color-main-text) !important;
}

@keyframes rotation {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(359deg);
	}
}
</style>
