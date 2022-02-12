<template>
	<div class="nc-icon-container">
		<img v-if="imgSrc"
			v-tooltip.right="{ content: tooltipHtml, classes: darkMode ? 'dark' : '', html: true, offset: 10 }"
			:src="imgSrc"
			class="small">
		<span v-else
			:class="{ icon: true, ...getElemTypeClass(node) }" />
	</div>
</template>

<script>
import axios from 'axios'
import Tooltip from '@nextcloud/vue/dist/Directives/Tooltip'
import { getElemTypeClass } from '../utils'

const PREVIEW_WIDTH = 128
const PREVIEW_HEIGHT = 128

export default {
	name: 'NextcloudFileIcon',

	components: {
	},

	directives: {
		tooltip: Tooltip,
	},

	props: {
		node: {
			type: Object,
			required: true,
		},
		ncUrl: {
			type: String,
			default: '',
		},
		client: {
			type: Object,
			required: true,
		},
		darkMode: {
			type: Boolean,
			default: false,
		},
	},

	data() {
		return {
			imgSrc: null,
			getElemTypeClass,
		}
	},

	computed: {
		filePreviewUrl() {
			// 2 endpoints available for previews, one takes the file path, the other takes the file ID
			return this.ncUrl
				// + '/index.php/core/preview.png?'
				// + 'file=' + encodeURIComponent(this.node.filename)
				+ '/index.php/core/preview?'
				+ 'fileId=' + this.node.fileid
				+ '&x=' + PREVIEW_WIDTH
				+ '&y=' + PREVIEW_HEIGHT
				+ '&forceIcon=0&a=0'
		},
		tooltipHtml() {
			return '<img class="plop" src="' + this.imgSrc + '" width="128" height="128">'
		},
	},

	mounted() {
		if (this.node.type === 'file' && this.node.haspreview) {
			this.setImgSrc()
		}
	},

	methods: {
		setImgSrcAxios() {
			axios.get(this.filePreviewUrl, { responseType: 'arraybuffer' }, {
				headers: {
					...this.client.getAuthHeader(),
				},
				// this has no effect, cookies are passed anyway
				withCredentials: false,
			}).then((response) => {
				const b64image = btoa(
					new Uint8Array(response.data)
						.reduce((data, byte) => data + String.fromCharCode(byte), '')
				)
				const mime = response.headers['content-type'].toLowerCase()
				this.imgSrc = `data:${mime};base64,${b64image}`
			})
		},
		setImgSrc() {
			const headers = new Headers()
			this.client.appendAuthHeader(headers)

			fetch(this.filePreviewUrl, {
				method: 'GET',
				credentials: 'omit',
				headers,
			}).then((response) => {
				if (response.status < 400) {
					response.blob().then((blob) => {
						const reader = new FileReader()
						reader.onloadend = () => {
							this.imgSrc = reader.result
						}
						reader.readAsDataURL(blob)
					})
				}
			})
		},
	},
}
</script>

<style scoped lang="scss">
.nc-icon-container {
	display: flex;
	align-items: center;

	img.small {
		width: 32px;
		height: 32px;
		margin: auto;
	}
}
</style>
