<template>
	<Breadcrumbs>
		<Breadcrumb title="Home" href="#/" />
		<Breadcrumb v-for="p in parts"
			:key="p.path"
			:title="p.name"
			:href="'#' + p.path" />
	</Breadcrumbs>
</template>

<script>
import { addCustomEventListener } from '../utils'
import Breadcrumb from '@nextcloud/vue/dist/Components/Breadcrumb'
import Breadcrumbs from '@nextcloud/vue/dist/Components/Breadcrumbs'

export default {
	name: 'PickerBreadcrumbs',

	components: {
		Breadcrumb,
		Breadcrumbs,
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
		addCustomEventListener('.crumb a', 'click', this.hashChange)
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
::v-deep .crumb {
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
