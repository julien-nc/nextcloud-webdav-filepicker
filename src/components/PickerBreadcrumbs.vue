<template>
	<NcBreadcrumbs class="crumbs">
		<NcBreadcrumb name="Home" href="#/">
			<template #icon>
				<HomeIcon :size="20" />
			</template>
		</NcBreadcrumb>
		<NcBreadcrumb v-for="p in parts"
			:key="p.path"
			:name="p.name"
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

:deep(.vue-crumb) {
	>a {
		padding: 0 8px;
		text-decoration: none;
		color: var(--color-text-lighter);
		border-radius: 8px;
	}

	&::before {
		color: var(--color-text-lighter);
	}
}
</style>
