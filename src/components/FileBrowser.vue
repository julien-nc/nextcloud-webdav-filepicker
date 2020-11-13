<template>
	<v-table
		id="element-table"
		:data="elements">
		<thead slot="head">
			<th style="width: 10%;" />
			<v-th sort-key="basename" style="width: 50%;">
				{{ t('filepicker', 'Name') }}
			</v-th>
			<v-th sort-key="size" style="width: 15%;">
				{{ t('filepicker', 'Size') }}
			</v-th>
			<v-th sort-key="lastmod_ts" style="width: 25%;">
				{{ t('filepicker', 'Modified') }}
			</v-th>
		</thead>
		<tbody slot="body" slot-scope="{displayData}">
			<tr v-for="value in displayData"
				:key="value.filename"
				:class="{ selectable: isSelectable(value), selected: selection.includes(value.filename) }"
				@click="onElemClick(value)">
				<td>
					<span :class="{ icon: true, ...getElemTypeClass(value) }" />
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
</template>

<script>
import moment from '@nextcloud/moment'
import { humanFileSize } from '../utils'

import Vue from 'vue'
import SmartTable from 'vuejs-smart-table'
Vue.use(SmartTable)

export default {
	name: 'FileBrowser',

	components: {
	},

	props: {
		elements: {
			type: Array,
			required: true,
		},
		forcedSelection: {
			type: Array,
			default: () => { return [] },
		},
		canSelectFiles: {
			type: Boolean,
			default: true,
		},
		multipleSelect: {
			type: Boolean,
			default: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},

	data() {
		return {
			selection: [],
		}
	},

	computed: {
	},

	watch: {
		forcedSelection() {
			this.selection = this.forcedSelection
		},
	},

	mounted() {
	},

	methods: {
		lastModFormat(ts) {
			return moment.unix(ts).format('L HH:mm:ss')
		},
		myHumanFileSize(bytes, approx = false, si = false, dp = 1) {
			return humanFileSize(bytes, approx, si, dp)
		},
		isSelectable(elem) {
			return elem.type === 'directory' || this.canSelectFiles
		},
		getElemTypeClass(elem) {
			if (elem.type === 'directory') {
				return { 'icon-folder': true }
			} else {
				const mime = elem.mime
				if (mime.match(/^video\//)) {
					return { 'icon-video': true }
				} else if (mime === 'text/calendar') {
					return { 'icon-calendar': true }
				} else if (mime === 'text/csv' || mime.match(/^application\/.*opendocument\.spreadsheet$/) || mime.match(/^application\/.*office.*sheet$/)) {
					return { 'icon-spreadsheet': true }
				} else if (mime.match(/^text\//)) {
					return { 'icon-text': true }
				} else if (mime.match(/^application\/pdf$/)) {
					return { 'icon-pdf': true }
				} else if (mime.match(/^application\/gpx/)) {
					return { 'icon-location': true }
				} else if (mime.match(/^image\//)) {
					return { 'icon-picture': true }
				} else if (mime.match(/^audio\//)) {
					return { 'icon-audio': true }
				} else if (mime.match(/^application\/.*opendocument\.text$/) || mime.match(/^application\/.*word.*document$/)) {
					return { 'icon-office-document': true }
				} else if (mime.match(/^application\/.*opendocument\.presentation$/) || mime.match(/^application\/.*office.*presentation$/)) {
					return { 'icon-office-presentation': true }
				}
				return { 'icon-file': true }
			}
		},
		onElemClick(e) {
			if (this.disabled) {
				return
			}
			if (e.type === 'directory') {
				this.$emit('folder-clicked', e.filename)
				this.selection = []
			} else if (this.canSelectFiles) {
				if (this.multipleSelect) {
					if (this.selection.includes(e.filename)) {
						this.selection.splice(this.selection.indexOf(e.filename), 1)
					} else {
						this.selection.push(e.filename)
					}
				} else {
					if (this.selection.includes(e.filename)) {
						this.selection = []
					} else {
						this.selection = [e.filename]
					}
				}
				this.$emit('selection-changed', this.selection)
			}
		},
	},
}
</script>

<style scoped lang="scss">
#element-table {
	width: 100%;
	height: 100%;
	overflow: scroll;
	scrollbar-color: var(--main-color-lighter) transparent;
	scrollbar-width: thin;
	display: block;
	border-spacing: 0;
	padding: 10px 0 10px 0;

	.icon {
		width: 100px;
		height: 50px;
		background-repeat: no-repeat;
		background-size: 30px;
		background-position: center;
	}

	th {
		text-align: left;
		height: 50px;
	}

	tr:not(:first-child) td {
		border-top: 1px solid #e3e3e3;
	}

	tr:not(.selectable) {
		opacity: 30%;
	}

	tr.selectable {
		&.selected:hover {
			background-color: var(--main-color-light);
		}

		&.selected {
			background-color: var(--main-color-lighter);
		}

		&:hover {
			background-color: #e3e3e3;
		}
	}

	td {
		border: 0;
	}

	.icon-file {
		background-image: url('./../../img/file.svg');
	}
	.icon-video {
		background-image: url('./../../img/video.svg');
	}
	.icon-audio {
		background-image: url('./../../img/audio.svg');
	}
	.icon-calendar {
		background-image: url('./../../img/calendar.svg');
		opacity: 0.4;
	}
	.icon-text {
		background-image: url('./../../img/text.svg');
	}
	.icon-spreadsheet {
		background-image: url('./../../img/spreadsheet.svg');
	}
	.icon-location {
		background-image: url('./../../img/location.svg');
	}
	.icon-picture {
		background-image: url('./../../img/picture.svg');
		opacity: 0.4;
	}
	.icon-pdf {
		background-image: url('./../../img/pdf.svg');
	}
	.icon-office-document {
		background-image: url('./../../img/office-document.svg');
	}
	.icon-office-presentation {
		background-image: url('./../../img/office-presentation.svg');
	}
}
</style>
