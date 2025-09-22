import { createApp } from 'vue'
import App from './App.vue'
import { TimeSchedulePlugin } from 'simple-vue-time-schedule/v3'

import 'simple-vue-time-schedule/v3/style'
createApp(App).use(TimeSchedulePlugin).mount('#app')
