<template>
	<div class="nc-icon-container">
		<img v-if="imgSrc"
			:src="imgSrc">
		<span v-else
			:class="{ icon: true, ...getElemTypeClass(node) }" />
	</div>
</template>

<script>
import axios from 'axios'
import { getElemTypeClass } from '../utils'

export default {
	name: 'NextcloudFileIcon',

	components: {
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
			// const genericUrl = this.ncUrl + '/index.php/core/preview.png?file={filename}&x=50&y=50&forceIcon=0&a=0'
			// return genericUrl.replace('{filename}', encodeURIComponent(this.node.filename))
			const genericUrl = this.ncUrl + '/index.php/core/preview?fileId={fileId}&x=50&y=50&forceIcon=0&a=0'
			return genericUrl.replace('{fileId}', this.node.fileid)
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

	img {
		width: 32px;
		height: 32px;
		margin: auto;
	}
}
</style>
