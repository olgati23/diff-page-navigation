<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardHome from './components/DashboardHome.vue'
import CustomizeDiffDialog from './components/CustomizeDiffDialog.vue'
import { customizeDiffKey, type DiffFilters } from './customizeDiff'
import { reviewChanges, type ReviewChange } from '../template-dashboard-desktop-modal/reviewChanges'
import DesktopQueue from '../template-dashboard-desktop-modal/index.vue'
import MobileQueue from '../template-dashboard-mobile-watch/review-changes/index.vue'

definePage({ meta: { title: 'Review changes', description: 'Standalone review queue and difference preview: mobile A and desktop B1.' } })
const route = useRoute()
const router = useRouter()
const showLocalFrame = computed(() => import.meta.env.DEV && route.query.localFrame !== '1')
const isLocalFramedContent = computed(() => import.meta.env.DEV && route.query.localFrame === '1')
const localFrameUrl = computed(() => router.resolve({ path: route.path, query: { ...route.query, localFrame: '1' } }).href)
const watchToast = computed(() => route.query.version !== 'Older')
const customizationOpen = ref(false)
const filters = ref<DiffFilters>({ longSummaries: false, longTitles: false, longUsernames: false })
const edits = ref<ReviewChange[]>(reviewChanges.slice(0, 10))
const queueKey = ref(0)
provide(customizeDiffKey, () => { customizationOpen.value = true })
async function applyCustomization(version: string, selectedFilters: DiffFilters, changes: ReviewChange[]) {
  await router.replace({ query: { ...route.query, version } })
  filters.value = selectedFilters
  edits.value = changes
  queueKey.value++
}
const previewScale = ref(Math.min(1, window.innerWidth / 412, window.innerHeight / 790))
const mobile = ref(window.innerWidth < 768)
const updateViewport = () => {
  mobile.value = window.innerWidth < 768
  previewScale.value = Math.min(1, window.innerWidth / 412, window.innerHeight / 790)
}
onMounted(() => window.addEventListener('resize', updateViewport))
onBeforeUnmount(() => window.removeEventListener('resize', updateViewport))
</script>

<template>
  <div v-if="showLocalFrame" class="local-preview-stage">
    <div class="local-preview-size" :style="{ width: `${412 * previewScale}px`, height: `${790 * previewScale}px` }">
      <iframe :src="localFrameUrl" title="412 by 790px mobile prototype" class="local-preview-frame" :style="{ transform: `scale(${previewScale})` }" />
    </div>
  </div>
  <div v-else :class="{ 'local-framed-content': isLocalFramedContent }">
  <DashboardHome v-if="route.query.view === 'home'" :edits="edits" />
  <MobileQueue v-else-if="mobile" :key="queueKey" :custom-changes="edits" standalone :watch-toast="watchToast" />
  <DesktopQueue v-else :key="queueKey" :custom-changes="edits" standalone standalone-version="B1" :watch-toast="watchToast" />
  <CustomizeDiffDialog v-model:open="customizationOpen" :version="watchToast ? 'Default' : 'Older'" :filters="filters" @apply="applyCustomization" />
  </div>
</template>

<style scoped>
:global(html:has(.local-framed-content)),
:global(body:has(.local-framed-content)),
.local-framed-content :deep(*) { scrollbar-width: none !important; scrollbar-gutter: auto; }
:global(html:has(.local-framed-content)::-webkit-scrollbar),
:global(body:has(.local-framed-content)::-webkit-scrollbar),
.local-framed-content :deep(*::-webkit-scrollbar) { display: none; width: 0; height: 0; }

:global(html:has(.local-preview-stage)),
:global(body:has(.local-preview-stage)) { overflow: hidden; scrollbar-gutter: auto; }
.local-preview-stage { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: flex-start; justify-content: center; overflow: hidden; background: #000; }
.local-preview-size { position: relative; flex-shrink: 0; }
.local-preview-frame { transform-origin: top left; display: block; width: 412px; height: 790px; flex-shrink: 0; border: 0; background: #fff; }
</style>
