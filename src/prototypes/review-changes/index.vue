<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CustomizeDiffDialog from './components/CustomizeDiffDialog.vue'
import { customizeDiffKey, type DiffFilters } from './customizeDiff'
import { reviewChanges, type ReviewChange } from '../template-dashboard-desktop-modal/reviewChanges'
import DesktopQueue from '../template-dashboard-desktop-modal/index.vue'
import MobileQueue from '../template-dashboard-mobile-watch/review-changes/index.vue'

definePage({ meta: { title: 'Review changes', description: 'Standalone review queue and difference preview: mobile A and desktop B1.' } })
const route = useRoute()
const router = useRouter()
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
const mobile = ref(window.innerWidth < 768)
const updateViewport = () => { mobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', updateViewport))
onBeforeUnmount(() => window.removeEventListener('resize', updateViewport))
</script>

<template>
  <MobileQueue v-if="mobile" :key="queueKey" :custom-changes="edits" standalone :watch-toast="watchToast" />
  <DesktopQueue v-else :key="queueKey" :custom-changes="edits" standalone standalone-version="B1" :watch-toast="watchToast" />
  <CustomizeDiffDialog v-model:open="customizationOpen" :version="watchToast ? 'Default' : 'Older'" :filters="filters" @apply="applyCustomization" />
</template>
