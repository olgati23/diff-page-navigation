<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { CdxButton } from '@wikimedia/codex'
import { useRoute, useRouter } from 'vue-router'
import DesktopQueue from '../template-dashboard-desktop-modal/index.vue'
import MobileQueue from '../template-dashboard-mobile-watch/review-changes/index.vue'

definePage({ meta: { title: 'Review changes', description: 'Standalone review queue and difference preview: mobile A and desktop B1.' } })
const route = useRoute()
const router = useRouter()
const watchToast = computed(() => route.query.version === 'Toast')
const mobile = ref(window.innerWidth < 768)
const updateViewport = () => { mobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', updateViewport))
onBeforeUnmount(() => window.removeEventListener('resize', updateViewport))
</script>

<template>
  <nav class="review-version-picker" aria-label="Prototype version">
    <CdxButton v-for="version in ['Default', 'Toast']" :key="version" :weight="watchToast === (version === 'Toast') ? 'primary' : 'normal'" :action="watchToast === (version === 'Toast') ? 'progressive' : 'default'" :aria-pressed="watchToast === (version === 'Toast')" @click="router.replace({ query: { ...route.query, version } })">{{ version }}</CdxButton>
  </nav>
  <MobileQueue v-if="mobile" standalone :watch-toast="watchToast" />
  <DesktopQueue v-else standalone standalone-version="B1" :watch-toast="watchToast" />
</template>

<style scoped>
.review-version-picker { display: flex; gap: 8px; padding: 12px 16px; }
</style>
