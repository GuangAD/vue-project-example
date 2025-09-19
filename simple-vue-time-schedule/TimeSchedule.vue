<template>
	<div :class="baseClass">
		<div ref="calendar" class="schedule-calendar">
			<!-- 拖拽选择时的遮罩层，显示选择区域 -->
			<div v-if="scheduleShow" ref="schedule" :class="scheduleClass" :style="scheduleStyle"></div>
			<div class="table-wrap">
				<table class="schedule-calendar-table">
					<thead>
						<tr v-if="showHeader" class="schedule-calendar-time-all">
							<!-- 空白占位列，用于显示周几标签 -->
							<th
								v-if="showDateLabel"
								class="schedule-week-td"
								:style="{ width: labelWidth + 'px' }"
								rowspan="2"
							></th>
							<th class="schedule-calendar-time" colspan="24">00:00 - 12:00</th>
							<th class="schedule-calendar-time" colspan="24">12:00 - 24:00</th>
						</tr>
						<tr class="schedule-calendar-time-item">
							<td v-for="(item, index) in dayHour" :key="index" colspan="2">
								{{ item }}
							</td>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(dayLabel, index) in dayLabels" :key="index">
							<td v-if="showDateLabel">
								<div class="schedule-label">
									<!-- 全选复选框 -->
									<input
										v-if="showCheckbox"
										v-model="dayCheckbox[index]"
										type="checkbox"
										:indeterminate="dayIndeterminate[index]"
										@change="handleDayCheck(index)"
									/>
									<div class="schedule-label-content">
										{{ dayLabel }}
									</div>
								</div>
							</td>
							<td
								v-for="(time, i) in dayHalfHour"
								:key="i"
								ref="calendarAtomTime"
								class="schedule-calendar-atom-time"
								:class="getScheduleCalendarClass(index, time)"
								:data-day="index"
								:data-time="time"
								@mousemove="$event => (canDrop ? setShadow($event) : emptyFunc)"
								@mousedown="$event => (canDrop ? setFirstSource(index, time, $event) : emptyFunc())"
								@mouseenter="
									$event =>
										canDrop
											? setHoverData($event, {
													time: time,
													dayLabel: dayLabel,
													day: index
											  })
											: emptyFunc()
								"
								@mouseleave="() => (canDrop ? removeHoverData() : emptyFunc())"
							></td>
						</tr>
						<!-- 底部信息栏 -->
						<tr v-if="props.showFooter">
							<td class="schedule-table-tip" :colspan="maxColspan">
								<div v-if="hasSelectedTime" class="schedule-selected-time">
									<div v-for="(_, index) in value" :key="index">
										<p v-if="timePeriodStrArr[index]">
											<span class="schedule-tip-text">
												{{ dayLabels[index] }}
											</span>
											<span>{{ timePeriodStrArr[index] }}</span>
										</p>
									</div>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed, defineEmits, defineProps, onMounted, onUnmounted, ref, watch } from "vue";

import { dayHalfHour, dayHour, getClockString, getContinuousChildArr, getDayHalfHourFromRange } from "./utils.js";
const props = defineProps({
	canDrop: { type: Boolean, default: true },
	canOverlap: { type: Boolean, default: false },
	modelValue: { type: Array, default: () => [] },
	showFooter: { type: Boolean, default: true },
	showHeader: { type: Boolean, default: true },
	type: { type: String, default: "normal" },
	showCheckbox: { type: Boolean, default: false },
	showDateLabel: { type: Boolean, default: true },
	disabledTimeRange: { type: Array, default: () => [] },
	dateList: {
		type: Array,
		default: () => ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]
	},
	labelWidth: { type: Number, default: 75 }
});

const emit = defineEmits(["update:modelValue", "error", "change"]);

const value = ref([]);
const timePeriodStrArr = ref([]);
const dayCheckbox = ref([]);
const dayIndeterminate = ref([]);

const disabledTimeIndex = computed(() => {
	return generateTimeRangeIndexArray(props.disabledTimeRange);
});

const maxColspan = computed(() => (props.showDateLabel ? 49 : 48));

watch(
	() => props.dateList,
	newVal => {
		const length = newVal.length;
		dayCheckbox.value = Array.from({ length }, () => false);
		dayIndeterminate.value = Array.from({ length }, () => false);
		timePeriodStrArr.value = Array.from({ length }, () => "");
	},
	{
		immediate: true
	}
);

const dayLabels = computed(() => {
	const days = props.dateList || [];
	return days;
});

const hasSelectedTime = computed(() => {
	return value.value.some(ele => ele && ele.length >= 1);
});

const baseClass = computed(() => {
	const classArr = ["schedule", "schedule-"];
	if (props.showCheckbox) {
		classArr.push("schedule-show-checkbox");
	}
	return classArr;
});

watch(
	() => props.modelValue,
	newVal => {
		const result = generateTimeRangeIndexArray(newVal);
		updateValue(result, { emitError: true });
	},
	{ immediate: true, deep: true }
);

function emptyFunc() {}

function isDayTimeDisabled(day, time) {
	return disabledTimeIndex.value[day]?.indexOf(time) !== -1;
}

function getScheduleCalendarClass(index, time) {
	const isSelect = selectedJudgement(index, time);
	const isDisabled = isDayTimeDisabled(index, time);

	const isOverlap = isSelect && isDisabled;

	const ret = [];
	if (isOverlap) {
		ret.push("schedule-calendar-overlap");
	} else if (isSelect) {
		ret.push("schedule-calendar-selected");
	} else if (isDisabled) {
		ret.push("schedule-calendar-disabled");
	}
	return ret;
}

function isEqualValue(arr1, arr2) {
	if (arr1.length !== arr2.length) {
		return false;
	}
	for (let i = 0; i < arr1.length; i++) {
		if (arr1[i].length !== arr2[i].length) {
			return false;
		}
		for (let j = 0; j < arr1[i].length; j++) {
			if (arr1[i][j] !== arr2[i][j]) {
				return false;
			}
		}
	}
	return true;
}

function updateValue(newValue, options = { emitError: false }) {
	const newClonedValue = JSON.parse(JSON.stringify(newValue));
	if (isEqualValue(newClonedValue, value.value)) {
		return;
	}
	let isError = false;
	newClonedValue.forEach((arr, day) => {
		if (arr) {
			for (let i = arr.length - 1; i >= 0; i--) {
				const hour = arr[i];
				if (isDayTimeDisabled(day, hour)) {
					if (!props.canOverlap) {
						arr.splice(i, 1);
					}
					isError = true;
				}
			}
		}
	});

	value.value = newClonedValue;

	for (let i = 0; i < value.value.length; i++) {
		transformTimeArrToString(value.value[i], i);
		const len = value.value[i] ? value.value[i].length : 0;
		if (len === 48) {
			dayCheckbox.value[i] = true;
			dayIndeterminate.value[i] = false;
		} else if (len === 0) {
			dayCheckbox.value[i] = false;
			dayIndeterminate.value[i] = false;
		} else {
			dayCheckbox.value[i] = false;
			dayIndeterminate.value[i] = true;
		}
	}

	if (isError && options.emitError) {
		emit("error", "选择的时间有冲突");
	}

	doEmit();
}

function generateTimeRangeIndexArray(list) {
	if (!list || !Array.isArray(list)) {
		return [];
	}

	const result = Array.from({ length: props.dateList.length }, () => []);

	list.forEach((dayRanges, dayIndex) => {
		if (!Array.isArray(dayRanges) || dayIndex >= props.dateList.length) {
			return;
		}

		dayRanges.forEach(timeRange => {
			const halfHourIds = getDayHalfHourFromRange(timeRange);
			halfHourIds.forEach(id => {
				if (!result[dayIndex].includes(id)) {
					result[dayIndex].push(id);
				}
			});
		});

		result[dayIndex].sort((a, b) => a - b);
	});
	return result;
}

function convertToTimeRange() {
	return timePeriodStrArr.value.map(item => item.split("、"));
}

function doEmit() {
	const timeRange = convertToTimeRange();
	console.log("🚀 ~ doEmit ~ timeRange:11", timeRange);
	emit("update:modelValue", timeRange);
	emit("change", timeRange);
	console.log("🚀 ~ doEmit ~ timeRange:22", timeRange);
}

function selectedJudgement(index, item) {
	const dayTimes = value.value[index];
	return dayTimes && dayTimes.indexOf(item) >= 0;
}

function handleDayCheck(index) {
	const copyValue = JSON.parse(JSON.stringify(value.value));
	if (!copyValue[index]) {
		copyValue[index] = [];
	}
	if (dayCheckbox.value[index]) {
		copyValue[index] = [...new Array(48).keys()];
	} else {
		copyValue[index] = [];
	}
	updateValue(copyValue);
}

function sortArr(arr) {
	if (!arr) {
		return [];
	}
	return [...arr].sort((a, b) => a - b);
}

function transformTimeArrToString(timeArr, targetTimePeriodStrArrIndex) {
	if (!timeArr || timeArr.length === 0) {
		timePeriodStrArr.value[targetTimePeriodStrArrIndex] = "";
		return;
	}
	const sortedTimeArr = sortArr(timeArr);
	const rangeArr = getContinuousChildArr(sortedTimeArr);
	const resStr = rangeArr
		.map(range => {
			let endDayStr;
			const startTimeStr = getClockString(range[0], "start");
			if (range.length === 1) {
				endDayStr = getClockString(range[0], "end");
			} else {
				endDayStr = getClockString(range[range.length - 1], "end");
			}
			return [startTimeStr, endDayStr].join("~");
		})
		.join("、");
	timePeriodStrArr.value[targetTimePeriodStrArrIndex] = resStr;
}
//
const startTdEl = ref(null);
const endTdEl = ref(null);
const start_point = ref(null);
const isAdd = ref(false);
const hoverDayLabel = ref("");
const hoverTime = ref("");
const hoverTimeoutId = ref();
const isPopover = ref(false);
const popOverCanShow = ref(false);
const scheduleShow = ref(false);
const scheduleStyle = ref({});
const hoverTipObj = ref({});
const scheduleClass = ref({
	"no-transition": false,
	"schedule-rang": true
});

const curTdEl = ref(null);

const calendar = ref(null);
const schedule = ref(null);
const calendarAtomTime = ref([]);

function getClientPosition(ele, outer = false) {
	const clientRect = ele.getBoundingClientRect();
	return {
		x: clientRect.left + (outer ? clientRect.width : 0),
		y: clientRect.top + (outer ? clientRect.height : 0)
	};
}

function setShadow(e) {
	curTdEl.value = e.target;
	if (!startTdEl.value || !start_point.value) {
		return;
	}

	const curPos = getClientPosition(curTdEl.value, true);
	const startTdElRect = startTdEl.value.getBoundingClientRect();
	const currentTdElRect = curTdEl.value.getBoundingClientRect();

	const distanceX = curPos.x - start_point.value.x;
	const distanceY = curPos.y - start_point.value.y;

	const left = distanceX > 0 ? startTdElRect.left : currentTdElRect.left;
	const top = distanceY > 0 ? startTdElRect.top : currentTdElRect.top;

	const width = distanceX > 0 ? currentTdElRect.right - startTdElRect.left : currentTdElRect.left - startTdElRect.right;
	const height = distanceY > 0 ? currentTdElRect.bottom - startTdElRect.top : currentTdElRect.top - startTdElRect.bottom;

	scheduleStyle.value = {
		opacity: 0.6,
		top: `${top}px`,
		left: `${left}px`,
		width: `${Math.abs(width)}px`,
		height: `${Math.abs(height)}px`
	};
}

function setHoverData(evt, obj) {
	hoverTipObj.value = obj;
	popOverCanShow.value = true;
	const hour = Math.floor(obj.time / 2) < 10 ? `0${Math.floor(obj.time / 2)}` : Math.floor(obj.time / 2);
	const tempHoverTime =
		obj.time % 2 ? `${hour}:30 - ${+hour + 1 < 10 ? `0${+hour + 1}` : +hour + 1}:00` : `${hour}:00 - ${hour}:30`;

	if (hoverTimeoutId.value) {
		clearTimeout(hoverTimeoutId.value);
	}

	hoverTimeoutId.value = setTimeout(() => {
		hoverDayLabel.value = obj.dayLabel;
		hoverTime.value = tempHoverTime;
		isPopover.value = popOverCanShow.value ? true : false;
		if (hoverTimeoutId.value) {
			clearTimeout(hoverTimeoutId.value);
		}
	}, 500);
}

function removeHoverData() {
	popOverCanShow.value = false;
	hoverDayLabel.value = "";
	hoverTime.value = "";
	isPopover.value = false;
}

function setFirstSource(week, time, e) {
	const dayTimes = value.value[week];
	isAdd.value = dayTimes ? dayTimes.indexOf(time) === -1 : true;

	if (e.which !== 1) {
		return;
	}
	startTdEl.value = e.target;
	start_point.value = getClientPosition(e.target);
	scheduleShow.value = true;
	scheduleStyle.value = {
		left: `${start_point.value.x}px`,
		top: `${start_point.value.y}px`,
		width: 0,
		height: 0,
		opacity: 0.6
	};
	scheduleClass.value["no-transition"] = true;
}

function onResetAllClick() {
	const emptyValue = Array.from({ length: dayLabels.value.length }, () => []);
	updateValue(emptyValue);
}

function scheduleEnd() {
	if (start_point.value) {
		endTdEl.value = curTdEl.value;
		scheduleClass.value["no-transition"] = false;
		highlightScheduleArea(startTdEl.value, endTdEl.value);
		start_point.value = null;
		startTdEl.value = null;
		curTdEl.value = null;
	}
}

function highlightScheduleArea(startEl, endEl) {
	if (!startEl || !endEl) {
		scheduleStyle.value.opacity = 0;
		scheduleShow.value = false;
		return;
	}
	const startDay = parseInt(startEl.getAttribute("data-day") ?? "0", 10);
	const startTime = parseInt(startEl.getAttribute("data-time") ?? "0", 10);
	const endDay = parseInt(endEl.getAttribute("data-day") ?? "0", 10);
	const endTime = parseInt(endEl.getAttribute("data-time") ?? "0", 10);

	const sDay = Math.min(startDay, endDay);
	const eDay = Math.max(startDay, endDay);
	const sTime = Math.min(startTime, endTime);
	const eTime = Math.max(startTime, endTime);

	scheduleStyle.value.opacity = 0;
	scheduleShow.value = false;
	updateSelectedValue({
		startTime: sTime,
		startDay: sDay,
		endTime: eTime,
		endDay: eDay
	});
}

function updateSelectedValue({ endDay, endTime, startDay, startTime }) {
	const copyValue = JSON.parse(JSON.stringify(value.value));

	calendarAtomTime.value.forEach(item => {
		const dataTime = parseInt(item.getAttribute("data-time") ?? "0", 10);
		const dataDay = parseInt(item.getAttribute("data-day") ?? "0", 10);

		if (dataTime >= startTime && dataTime <= endTime && dataDay >= startDay && dataDay <= endDay) {
			if (!copyValue[dataDay]) {
				copyValue[dataDay] = [];
			}

			const currentDayTimes = [...copyValue[dataDay]];
			const curIndex = currentDayTimes.indexOf(dataTime);

			if (isAdd.value) {
				if (curIndex === -1) {
					currentDayTimes.push(dataTime);
				}
			} else {
				if (curIndex > -1) {
					currentDayTimes.splice(curIndex, 1);
				}
			}
			copyValue[dataDay] = currentDayTimes;
		}
	});
	updateValue(copyValue);
}

onMounted(() => {
	if (props.canDrop) {
		document.addEventListener("mouseup", scheduleEnd);
		document.addEventListener("mousewheel", scheduleEnd);
	}
});

onUnmounted(() => {
	document.removeEventListener("mouseup", scheduleEnd);
	document.removeEventListener("mousewheel", scheduleEnd);
});
</script>
<style scoped>
.schedule {
	min-width: 700px;
}

.schedule-link {
	display: block;
	margin-right: 24px;
	color: #333;
}

.schedule .bui-schedule-tooltip {
	display: inline;
}

.schedule .bui-schedule-tooltip .bui-popover-panel {
	padding: 8px 16px;
}

.schedule table {
	border-left: none;
	border-style: hidden;
	table-layout: fixed;
	width: 100%;
}

.schedule .table-wrap {
	margin: 0 auto;
	border-radius: 4px;
	overflow: hidden;
	border: 1px solid #ebebeb;
}

.schedule td,
.schedule th {
	padding: 0;
}

.schedule-header {
	border: 1px solid #ebebeb;
	border-bottom: none;
	display: -webkit-box;
	display: -ms-flexbox;
	display: flex;
	-webkit-box-pack: justify;
	-ms-flex-pack: justify;
	justify-content: space-between;
	-webkit-box-align: center;
	-ms-flex-align: center;
	align-items: center;
	height: 38px;
	padding: 0 12px;
	font-size: 12px;
	background-color: transparent;
}

.schedule-option {
	display: -webkit-box;
	display: -ms-flexbox;
	display: flex;
}

.schedule-option .schedule-option-selected {
	color: #338aff;
}

.schedule-explain {
	display: -webkit-box;
	display: -ms-flexbox;
	display: flex;
}

.schedule-header-selectable,
.schedule-header-selected {
	display: -webkit-box;
	display: -ms-flexbox;
	display: flex;
	color: #333;
	-webkit-box-align: center;
	-ms-flex-align: center;
	align-items: center;
	margin-right: 11px;
}

.schedule-header-selectable::before,
.schedule-header-selected::before {
	content: "";
	display: block;
	width: 12px;
	height: 4px;
	background-color: #338aff;
	border-radius: 2px;
	margin-right: 8px;
}

.schedule-header-selectable {
	margin-right: 0;
}

.schedule-header-selectable::before {
	border: 1px solid #dadfe3;
	background-color: transparent;
}

.schedule-no-selected-time {
	margin: 0;
}

.schedule-rang {
	background: #338aff;
	width: 0;
	height: 0;
	position: fixed;
	z-index: 2;
	top: 0;
	left: 0;
	pointer-events: none;
	-webkit-transition: all 1ms ease;
	transition: all 1ms ease;
}

.schedule-week-td {
	padding: 20px 0;
}

.schedule-calendar {
	-webkit-user-select: none;
	position: relative;
	display: inline-block;
}

.schedule-calendar-time {
	font-weight: 400;
}

.schedule-calendar-time-all {
	height: 39px;
}

.schedule-calendar-time-item {
	height: 31px;
}

.schedule-calendar-atom-time:hover {
	background: #f0f0f0;
}

.schedule-calendar .schedule-calendar-disabled {
	background: #ddd;
	cursor: not-allowed;
}

.schedule-calendar .schedule-calendar-selected,
.schedule-calendar .schedule-calendar-selected:hover {
	background: #338aff;
}
.schedule-calendar .schedule-calendar-overlap,
.schedule-calendar .schedule-calendar-overlap:hover {
	background: #f70909;
}
.schedule-calendar-table {
	border-collapse: separate;
	border-radius: 4px;
}

.schedule-calendar-table tr td,
.schedule-calendar-table tr th {
	border-left: none;
	border-top: none;
	border-bottom: 1px solid;
	border-bottom-color: #ebebeb;
	border-right: 1px solid;
	border-right-color: #ebebeb;
	font-size: 14px;
	text-align: center;
	min-width: 11px;
	line-height: 1.8em;
	-webkit-transition: background 0.2s ease;
	transition: background 0.2s ease;
	color: #333;
	background: 0 0;
}

.schedule-calendar-table tr td:last-child,
.schedule-calendar-table tr th:last-child {
	border-right: none;
}

.schedule-calendar-table tbody tr {
	height: 30px;
}

.schedule-calendar-table tbody tr:last-child td {
	border-bottom: none;
}

.schedule-calendar-table .schedule-table-tip {
	line-height: 2.4em;
	padding: 12px 12px 0 19px;
}

.schedule-calendar-table .schedule-table-tip .clearfix {
	height: 22px;
	line-height: 22px;
	margin: 8px 0;
	text-align: left;
}

.schedule-calendar-table .schedule-table-tip .clearfix .schedule-no-selected-time {
	color: #666;
	text-align: center;
}

.schedule-calendar-table .schedule-table-tip .pull-left {
	font-size: 14px;
	color: #333;
}

.schedule-tip-text {
	color: #333;
	margin-right: 8px;
}

.schedule-selected-time {
	text-align: left;
	line-height: 2.4em;
}

.schedule-selected-time .schedule-tip-text {
	min-width: 60px;
}

.schedule-selected-time div:last-child {
	margin-bottom: 6px;
}

.schedule-selected-time p {
	word-break: break-all;
	margin: 0 0 8px;
	font-size: 14px;
	line-height: 22px;
	display: -webkit-box;
	display: -ms-flexbox;
	display: flex;
	color: #666;
}

.schedule a {
	cursor: pointer;
	color: #338aff;
	font-size: 14px;
}

.schedule-senior .table-wrap {
	border-top-left-radius: 0;
	border-top-right-radius: 0;
}

.schedule-senior .schedule-header {
	border-top-left-radius: 4px;
	border-top-right-radius: 4px;
}

.schedule-show-checkbox .schedule-label {
	text-align: left;
	display: -webkit-box;
	display: -ms-flexbox;
	display: flex;
}

.schedule-show-checkbox .schedule-label .checkbox {
	padding-left: 5px;
}

.schedule-show-checkbox .schedule-label-content {
	padding-left: 5px;
	-webkit-box-align: center;
	-ms-flex-align: center;
	align-items: center;
}
</style>
