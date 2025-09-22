import Vue from 'vue'
import App from './App.vue'
import { TimeSchedulePlugin } from 'simple-vue-time-schedule/v2.7'

import 'simple-vue-time-schedule/v2.7/style'

Vue.use(TimeSchedulePlugin)
new Vue({ render: (h) => h(App) }).$mount('#app')
