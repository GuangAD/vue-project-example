<template>
	<TimeSchedule
		:value="selected"
		:show-checkbox="false"
		:can-drop="canDrop"
		:can-overlap="canOverlap"
		:show-date-label="false"
		:date-list="dateList"
		:show-footer="false"
		:show-header="false"
		:disabled-time-range="_disabledTimeRange"
		@change="handleChange"
		@error="handleError"
	/>
</template>

<script>
import TimeSchedule from "./TimeScheduleVue2.vue";
export default {
	components: {
		TimeSchedule
	},
	props: {
		modelValue: {
			type: Array,
			default: () => []
		},
		canDrop: {
			type: Boolean,
			default: true
		},
		canOverlap: { type: Boolean, default: false },
		disabledTimeRange: {
			type: Array,
			default: () => []
		}
	},
	computed: {
		selected() {
			return [this.modelValue];
		},
		_disabledTimeRange() {
			return [this.disabledTimeRange];
		}
	},
	data() {
		return {
			dateList: ["时间"]
		};
	},
	methods: {
		handleChange(nelValue) {
			this.$emit("update:modelValue", nelValue[0]);
			this.$emit("change", nelValue[0]);
		},
		handleError(err) {
			this.$emit("error", err);
		}
	}
};
</script>
