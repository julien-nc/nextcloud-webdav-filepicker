<template>
	<div>
		<NcDatetimePicker
			id="my-datepicker"
			v-bind="$attrs"
			v-on="$listeners" />
	</div>
</template>

<script>
import NcDatetimePicker from '@nextcloud/vue/dist/Components/NcDatetimePicker.js'
export default {
	name: 'MyDatetimePicker',

	components: {
		NcDatetimePicker,
	},

	props: [],

	data() {
		return {
		}
	},

	computed: {
	},

	methods: {
	},
}
</script>

<style scoped lang="scss">
// this is why this component exists: fix style issues because we can be outside Nextcloud :-)
::v-deep #my-datepicker {
	width: 100%;
	* {
		opacity: 1;
	}
	.mx-calendar {
		padding: 3px;
	}
	.mx-calendar-header-label button {
		padding: 0 10px 0 10px;
	}
	.mx-calendar-header button,
	.mx-calendar-header-label button {
		background: none;
		border: none;
		&:hover {
			background: var(--color-background-dark);
		}
	}
	.mx-calendar-content .cell.disabled {
		background: var(--color-background-hover);
		flex-basis: 33px;
		> * {
			cursor: not-allowed;
		}
	}
}
</style>
