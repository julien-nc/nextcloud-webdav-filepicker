<template>
	<NcBreadcrumbs class="crumbs">
		<NcBreadcrumb title="Home" href="#/">
			<template #icon>
				<HomeIcon :size="20" />
			</template>
		</NcBreadcrumb>
		<NcBreadcrumb v-for="p in parts"
			:key="p.path"
			:title="p.name"
			:href="'#' + p.path" />
	</NcBreadcrumbs>
</template>

<script>
import HomeIcon from 'vue-material-design-icons/Home.vue'

import NcBreadcrumb from '@nextcloud/vue/dist/Components/NcBreadcrumb.js'
import NcBreadcrumbs from '@nextcloud/vue/dist/Components/NcBreadcrumbs.js'

import { addCustomEventListener } from '../utils.js'

export default {
	name: 'PickerBreadcrumbs',

	components: {
		NcBreadcrumb,
		NcBreadcrumbs,
		HomeIcon,
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
.crumbs {
	:deep(.breadcrumb__crumbs) {
		padding: 0 !important;
	}
}

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
</style>
