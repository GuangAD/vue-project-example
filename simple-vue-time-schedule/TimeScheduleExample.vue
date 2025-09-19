<template>
  <div>
    <h3>Time Schedule Example</h3>
    <p>This component demonstrates how to use the TimeSchedule component.</p>
    <TimeSchedule v-model="schedule" />
    <h4>Selected Time Slots:</h4>
    <pre>{{ schedule }}</pre>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import TimeSchedule from './TimeSchedule.vue';

const schedule = ref([
  [["08:00~10:00"], ["14:00~16:00"]],
  [],
  [],
  [],
  [],
  [],
  []
]);
</script>

<style scoped>
pre {
  background-color: #f4f4f4;
  padding: 1em;
  border-radius: 5px;
}
</style>
