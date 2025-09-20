<template>
	<TimeSchedule :model-value="selected" :show-checkbox="false" :can-drop="canDrop" :can-overlap="canOverlap"
		:show-date-label="false" :date-list="dateList" :show-footer="false" :show-header="false"
		:disabled-time-range="_disabledTimeRange" @update:modelValue="handleChange" @error="handleError" />
</template>

<script setup>
import TimeSchedule from "./TimeSchedule.vue";
import { defineProps, defineEmits, ref, computed } from 'vue'

const props = defineProps({
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


})
const selected = computed(() => [props.modelValue])

const _disabledTimeRange = computed(() => [props.disabledTimeRange])

const dateList = ['时间']

const emit = defineEmits(['update:modelValue', 'change', 'error']);

function handleChange(nelValue) {
	emit("update:modelValue", nelValue[0]);
	emit("change", nelValue[0]);
}
function handleError(err) {
	emit("error", err);
}
</script>
