<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import DesktopQueue from '../template-dashboard-desktop-modal/index.vue'
import MobileQueue from '../template-dashboard-mobile-watch/review-changes/index.vue'

definePage({ meta: { title: 'Review changes', description: 'Standalone review queue and difference preview: mobile A and desktop B1.' } })
const mobile = ref(window.innerWidth < 768)
const updateViewport = () => { mobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', updateViewport))
onBeforeUnmount(() => window.removeEventListener('resize', updateViewport))
</script>

<template>
  <MobileQueue v-if="mobile" standalone />
  <DesktopQueue v-else standalone standalone-version="B1" />
</template>
