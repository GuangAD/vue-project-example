<script>
import TimeScheduleAlone from '../../../simple-vue-time-schedule/TimeScheduleAloneVue3.vue'

export default {
  components: {
    TimeScheduleAlone
  },
  data() {
    return {
      text: '08:00~12:00',
      timeRange: ['08:00~12:00'],
      disableRange: ["09:00~11:00", "14:00~17:00"]
    }
  },
  methods: {
    handlerInputChange(val) {
      console.log("🚀 ~ handlerInputChange ~ val:", val.target.value)
      this.timeRange = [val.target.value]
    },
    handlerRangeChange(range) {
      if (range && range.length) {
        this.text = range[0]
      } else {
        this.text = ''
      }
    }
  },
}
</script>


<template>
  <div>
    <input type="text" v-model="text" @change="handlerInputChange">
    <TimeScheduleAlone canOverlap :model-value="timeRange" :disabled-time-range="disableRange"
      @change="handlerRangeChange" />
  </div>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
