import Vue from "vue";
import App from "./App.vue";
import { TimeSchedulePlugin } from "simple-vue-time-schedule/v2.7";
// import ElementUI from 'element-ui';
// import 'element-ui/lib/theme-chalk/index.css';
import "simple-vue-time-schedule/v2.7/style";
Vue.config.productionTip = false;

Vue.use(TimeSchedulePlugin);
// Vue.use(ElementUI);

new Vue({
  render: (h) => h(App),
}).$mount("#app");
