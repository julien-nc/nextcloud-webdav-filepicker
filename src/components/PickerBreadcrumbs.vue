<template>
	<NcBreadcrumbs>
		<NcBreadcrumb title="Home" href="#/" />
		<NcBreadcrumb v-for="p in parts"
			:key="p.path"
			:title="p.name"
			:href="'#' + p.path" />
	</NcBreadcrumbs>
</template>

<script>
import { addCustomEventListener } from '../utils'
import NcBreadcrumb from '@nextcloud/vue/dist/Components/NcBreadcrumb.js'
import NcBreadcrumbs from '@nextcloud/vue/dist/Components/NcBreadcrumbs.js'

export default {
	name: 'PickerBreadcrumbs',

	components: {
		NcBreadcrumb,
		NcBreadcrumbs,
	},

	props: {
		parts: {
			type: Array,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},

	computed: {
	},

	mounted() {
		addCustomEventListener('.vue-crumb a', 'click', this.hashChange)
	},

	methods: {
		hashChange(event, elem) {
			event.preventDefault()
			event.stopPropagation()
			if (!this.disabled) {
				const path = elem.getAttribute('href').replace('#', '')
				this.$emit('hash-changed', path)
			}
		},
	},
}
</script>

<style scoped lang="scss">
::v-deep .vue-crumb {
	>a {
		padding: 12px;
		text-decoration: none;
		color: var(--color-text-lighter);
	}

	.icon {
		margin-top: -6px;
		top: 2px;
		position: relative;
		// opacity: 0.4;
	}

	&::before {
		color: var(--color-text-lighter);
	}
}

::v-deep .icon-home {
	// background-image: url('./../../img/home.svg');
	mask: url('./../../img/home.svg') no-repeat;
	mask-size: 16px auto;
	mask-position: center;
	-webkit-mask: url('./../../img/home.svg') no-repeat;
	-webkit-mask-size: 16px auto;
	-webkit-mask-position: center;
	background-color: var(--color-text-lighter);
}
</style>
