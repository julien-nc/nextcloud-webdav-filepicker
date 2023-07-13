<template>
	<div class="search-bar">
		<div>
			<NcPopover
				container=".modal-container"
				:focus-trap="false">
				<template #trigger>
					<NcButton
						type="tertiary"
						:aria-label="labels.filterButton">
						<template #icon>
							<MdiFilter :size="20" />
						</template>
					</NcButton>
				</template>
				<template #default>
					<div class="search-options-popup-form">
						<h3>{{ t('filepicker', 'Asset type') }}</h3>
						<div>
							<NcSelect v-bind="contentTypesSelect.props"
								v-model="contentTypesSelect.props.value" />
						</div>
						<h3>{{ t('filepicker', 'Depth search level') }}</h3>
						<div>
							<NcSelect
								v-bind="depthSelect.props"
								v-model="depthSelect.props.value" />
						</div>
						{{ t('filepicker', 'Note: search will be limited to 20 elements, please narrow the search') }}
						<h3>{{ t('filepicker', 'Modified date filter') }}</h3>
						<div class="date-options-container">
							<div>
								<NcSelect
									v-bind="modifiedDateOperator.props"
									v-model="modifiedDateOperator.props.value" />
							</div>
							<div>
								<NcDateTimePickerNative
									id="modified-datepicker"
									v-model="modifiedDate"
									type="date"
									aria-label="labels.filterDatepicker"
									label=""
									:disabled="modifiedDateOperator.props.value.id ? modifiedDateOperator.props.value.id === 'disabled' : true"
									:value="new Date()"
									:placeholder="t('filepicker', 'Modified after')" />
							</div>
						</div>
						<h3>{{ t('filepicker', 'Tag filters') }}</h3>
						<div>
							<NcCheckboxRadioSwitch :checked.sync="favorited" type="switch">
								{{ t('filepicker', 'Only favorited') }}
							</NcCheckboxRadioSwitch>
						</div>
					</div>
				</template>
			</NcPopover>
		</div>
		<div>
			<NcTextField :value.sync="searchingText"
				:label="labels.searchText"
				trailing-button-icon="close"
				:show-trailing-button="searchingText !== ''"
				@keyup.enter="doSearch"
				@trailing-button-click="clearText">
				<Magnify :size="16" />
			</NcTextField>
		</div>
		<div>
			<NcButton
				:aria-label="labels.searchButton"
				type="secondary"
				class="search-button"
				@click="doSearch">
				<template #icon>
					<Magnify
						:size="20" />
				</template>
				{{ t('filepicker', 'Search') }}
			</NcButton>
		</div>
	</div>
</template>

<script>
import { NcSelect, NcTextField, NcButton, NcCheckboxRadioSwitch, NcPopover, NcDateTimePickerNative } from '@nextcloud/vue'
import { t, n } from '../translation.js'
import Magnify from 'vue-material-design-icons/Magnify.vue'
import MdiFilter from 'vue-material-design-icons/Filter.vue'

export default {
	name: 'PickerSearch',

	components: {
		NcSelect,
		NcTextField,
		NcButton,
		Magnify,
		NcCheckboxRadioSwitch,
		NcPopover,
		NcDateTimePickerNative,
		MdiFilter,
	},

	props: {
		initialSearchText: {
			type: String,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},

	data() {
		return {
			t,
			n,
			labels: {
				searchText: t('filepicker', 'Search files with this text'),
				searchButton: t('filepicker', 'Search'),
				searchOptions: t('filepicker', 'Options'),
				filterButton: t('filepicker', 'Search filters'),
			},
			searchingText: this.initialSearchText,
			contentTypesSelect: {
				name: 'File types',
				props: {
					inputId: 'content-type-select',
					multiple: true,
					placeholder: t('filepicker', 'File types'),
					options: [
						{
							label: t('filepicker', 'images'),
							id: 'image/%',
						},
						{
							label: t('filepicker', 'documents'),
							id: 'document/%',
						},
						{
							label: t('filepicker', 'videos'),
							id: 'video/%',
						},
						{
							label: t('filepicker', 'audios'),
							id: 'audio/%',
						},
					],
				},
			},
			depthSelect: {
				name: 'Depth',
				props: {
					inputId: 'depth-select',
					placeholder: t('filepicker', 'Within directories'),
					options: [
						/* not implemented as of https://github.com/nextcloud/server/issues/14313
						{
							label: t('filepicker', 'Current'),
							id: '0',
						},
						{
							label: t('filepicker', 'Current and 1st children'),
							id: '1',
						}, */
						{
							label: t('filepicker', 'Current and recursive'),
							id: 'infinity',
						},
					],
					/* Should be 0 but not implemented as of https://github.com/nextcloud/server/issues/14313 */
					value: {
						label: t('filepicker', 'Current and recursive'),
						id: 'infinity',
					},
				},
			},
			modifiedDateOperator: {
				name: 'Modified date operator',
				props: {
					inputId: 'modified-date-operator',
					placeholder: t('filepicker', 'Date operator'),
					options: [
						{
							label: t('filepicker', 'After'),
							id: 'gt',
						},
						{
							label: t('filepicker', 'Before'),
							id: 'lt',
						},
						{
							label: t('filepicker', 'Disabled'),
							id: 'disabled',
						},
					],
					value: {
						label: t('filepicker', 'Disabled'),
						id: 'disabled',
					},
				},
			},
			modifiedDate: new Date(),
			favorited: false,
		}
	},

	methods: {
		clearText() {
			this.searchingText = ''
		},
		doSearch(event, elem) {
			event.preventDefault()
			event.stopPropagation()
			if (!this.disabled) {
				let conditionsCounter = 0
				// count conditions to help in building the query
				if (this.contentTypesSelect.props.value) {
					conditionsCounter = this.contentTypesSelect.props.value.length
				}
				if (this.searchingText) {
					++conditionsCounter
				}
				if (this.modifiedDateOperator.props.value.id && this.modifiedDateOperator.props.value.id !== 'disabled') {
					++conditionsCounter
				}
				if (this.favorited) {
					++conditionsCounter
				}
				this.$emit('do-search', this.searchingText, {
					depth: this.depthSelect.props.value.id,
					content_type: this.contentTypesSelect.props.value || [],
					modified_date: this.modifiedDate.toISOString().split('.')[0] + 'Z' || '',
					modified_date_operator: this.modifiedDateOperator.props.value.id,
					favorited: this.favorited,
					conditionsCounter,
				})
			}
		},
	},
}
</script>

<style lang="scss">
.search-options-popup-form {
	padding: 5px;
	.date-options-container {
		display: flex;
		margin-right: 10px;
		gap: 4px;
		.v-select.select {
			min-width:150px;
		}
		.native-datetime-picker--input {
			height: 50px;
			border-radius: 9px;
			border: var(--vs-border-width) var(--vs-border-style) var(--vs-border-color);
		}
	}
}
</style>

<style scoped lang="scss">
::v-deep .input-field__input {
	width:revert;
}

.search-bar{
	display: flex;
	gap: 4px;
	align-items: center;
}

</style>
