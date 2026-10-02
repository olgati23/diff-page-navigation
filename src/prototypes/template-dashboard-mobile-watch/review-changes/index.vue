<script setup lang="ts">
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconArrowPrevious, cdxIconEllipsis, cdxIconUserAvatar } from '@wikimedia/codex-icons'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { computed, ref, watch } from 'vue'

import { reviewChanges, type ReviewChange } from '../reviewChanges'
import DiffPreviewModal from './DiffPreviewModal.vue'
import { localizedPrototypeRoute } from '../../prototypeLocale'

definePage({
  meta: {
    title: 'Review changes',
    description: 'Detailed review queue for the dashboard template.',
  },
})

const props = defineProps<{ standalone?: boolean }>()
const route = useRoute()
const router = useRouter()
const mobileVersion = computed(() => !props.standalone && route.query.version === 'B' ? 'B' : 'A')

const previewVariant = ref<'card' | 'toolbar' | 'simplified'>('toolbar')
const dashboardRoute = localizedPrototypeRoute('/template-dashboard-mobile-watch')
const editLimit = ref(7)
const queueChanges = reviewChanges.slice(0, 20)
const visibleChanges = computed(() => queueChanges.slice(0, editLimit.value))
const openedChanges = ref(new Set<string>())
const queueComplete = ref(false)
const selectedChangeIndex = ref<number | null>(null)
const reviewedChanges = ref<Set<string>>(new Set())
const undoneChanges = ref<Set<string>>(new Set())
const selectedChange = computed(() =>
  selectedChangeIndex.value === null ? null : queueChanges[selectedChangeIndex.value],
)
const selectedPreviewChange = computed(() => {
  const change = selectedChange.value
  if (!change || !undoneChanges.value.has(change.title)) return change
  return {
    ...change,
    revisionId: change.oldRevisionId,
    oldRevisionId: change.revisionId,
    summary: `Undo: ${change.summary}`,
  }
})

watch(selectedChangeIndex, index => {
  if (index !== null) openedChanges.value.add(queueChanges[index].title)
})

function openDiff(change: ReviewChange) {
  queueComplete.value = false
  selectedChangeIndex.value = queueChanges.indexOf(change)
}

function navigateDiff(direction: -1 | 1) {
  if (selectedChangeIndex.value === null) return
  if (queueComplete.value && direction === -1) {
    queueComplete.value = false
    return
  }
  const nextIndex = selectedChangeIndex.value + direction
  if (mobileVersion.value === 'B' && nextIndex === queueChanges.length) {
    queueComplete.value = true
    return
  }
  if (nextIndex >= 0 && nextIndex < (props.standalone || mobileVersion.value === 'B' ? queueChanges.length : visibleChanges.value.length)) {
    if (props.standalone || mobileVersion.value === 'B') editLimit.value = Math.max(editLimit.value, nextIndex + 1)
    selectedChangeIndex.value = nextIndex
  }
}

function markReviewed(title: string, reviewed: boolean) {
  const next = new Set(reviewedChanges.value)
  if (reviewed) next.add(title)
  else next.delete(title)
  reviewedChanges.value = next
}

function markUndone(title: string) {
  const next = new Set(undoneChanges.value)
  next.add(title)
  undoneChanges.value = next
}

function markRestored(title: string) {
  const next = new Set(undoneChanges.value)
  next.delete(title)
  undoneChanges.value = next
}
</script>

<template>
  <main class="review-changes-page">
    <template v-if="!selectedChange">
    <header class="review-changes-page__header" :class="{ 'review-changes-page__header--standalone': props.standalone }">
      <RouterLink v-if="!props.standalone" :to="dashboardRoute" class="review-changes-page__back" aria-label="Back to dashboard">
        <CdxIcon :icon="cdxIconArrowPrevious" />
      </RouterLink>
      <h1 class="review-changes-page__title">Review changes</h1>
      <CdxIcon :icon="cdxIconEllipsis" aria-label="More options" />
    </header>

    <nav v-if="!props.standalone" class="mobile-version-switch" aria-label="Prototype version">
      <CdxButton v-for="version in ['A', 'B']" :key="version" :aria-pressed="mobileVersion === version"
        :action="mobileVersion === version ? 'progressive' : 'default'"
        :weight="mobileVersion === version ? 'primary' : 'normal'"
        @click="router.replace({ query: { ...route.query, version } })">Version {{ version }}</CdxButton>
    </nav>
    <section class="review-changes-page__list" aria-label="Suggested changes to review">
      <article
        v-for="change in visibleChanges"
        :key="change.title"
        class="review-queue-card"
        :class="{ 'review-queue-card--opened': openedChanges.has(change.title) }"
        role="button"
        tabindex="0"
        :aria-label="`Preview changes to ${change.title}`"
        @click="openDiff(change)"
        @keydown.enter="openDiff(change)"
        @keydown.space.prevent="openDiff(change)"
      >
        <div class="review-queue-card__heading">
          <h2>{{ change.title }}</h2>
        </div>
        <p class="review-queue-card__description">{{ change.description }}</p>
        <p v-if="change.summary" class="review-queue-card__summary">{{ change.summary }}</p>
        <p class="review-queue-card__editor">
          <CdxIcon :icon="cdxIconUserAvatar" size="small" aria-hidden="true" />
          {{ change.editor }} · {{ change.time }}
        </p>
      </article>
    </section>
    <div class="review-queue-footer">
      <CdxButton v-if="visibleChanges.length < queueChanges.length" @click="editLimit = Math.min(editLimit + 7, 20)">Show more changes</CdxButton>
      <p v-else>There are no more changes for now. Check back later or explore <a href="https://en.wikipedia.org/wiki/Special:RecentChanges">Recent Changes</a>.</p>
    </div>
    </template>

    <DiffPreviewModal
      v-if="selectedChange"
      :key="previewVariant"
      :change="selectedPreviewChange!"
      :mobile-version="mobileVersion"
      :completion-toast="props.standalone"
      :all-changes-opened="queueChanges.every(change => openedChanges.has(change.title))"
      :variant="previewVariant"
      :change-index="selectedChangeIndex ?? 0"
      :change-count="props.standalone || mobileVersion === 'B' ? queueChanges.length : visibleChanges.length"
      :complete="queueComplete"
      :reviewed="reviewedChanges.has(selectedChange.title)"
      :undone="undoneChanges.has(selectedChange.title)"
      page
      @navigate="navigateDiff"
      @reviewed="markReviewed"
      @undone="markUndone"
      @restored="markRestored"
      @close="selectedChangeIndex = null; queueComplete = false"
    />
  </main>
</template>

<style scoped>
.mobile-version-switch { display: flex; gap: 8px; padding: 12px 16px; }
.review-changes-page {
  min-height: 100vh;
  color: var(--color-base);
  background: var(--background-color-neutral-subtle);
}

.review-changes-page__header {
  display: grid;
  grid-template-columns:
    minmax(var(--min-size-interactive-pointer, 32px), 1fr)
    auto
    minmax(var(--min-size-interactive-pointer, 32px), 1fr);
  align-items: center;
  height: 46px;
  padding-inline: var(--spacing-100, 16px);
  background: var(--background-color-base);
  border-bottom: var(--border-subtle);
}

.review-changes-page__header > * {
  align-self: center;
}

.review-changes-page__header > :last-child {
  display: block;
  justify-self: end;
}

.review-changes-page__title {
  align-self: center;
  justify-self: center;
  margin: 0;
  font-family: var(--font-family-base);
  font-size: var(--font-size-large);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-large);
  text-align: center;
}

.review-changes-page__back {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  align-self: center;
  justify-self: start;
  width: var(--min-size-interactive-pointer, 32px);
  height: var(--min-size-interactive-pointer, 32px);
  color: var(--color-base);
}

.review-changes-page__list {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
}

.review-changes-page__variant {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-50, 8px);
  padding: var(--spacing-75, 12px);
  background: var(--background-color-base);
  border: var(--border-subtle);
}

.review-changes-page__variant > span {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-small);
}

.review-queue-card {
  position: relative;
  padding: var(--spacing-100, 16px);
  background: var(--background-color-base);
  border: 0;
  cursor: pointer;
  transition:
    background-color 100ms,
    border-color 100ms,
    box-shadow 100ms;
}

.review-queue-card:hover {
  background: var(--background-color-interactive-subtle--hover);
  border-color: var(--border-color-interactive--hover);
}

.review-queue-card--opened,
.review-queue-card--opened:hover {
  background: var(--background-color-neutral, #eaecf0);
}
.review-queue-footer { padding: var(--spacing-100, 16px); }
.review-queue-footer p { margin: 0; line-height: 1.6; }

.review-queue-card:focus-visible {
  border-color: var(--border-color-progressive--focus);
  box-shadow: inset 0 0 0 1px var(--box-shadow-color-progressive--focus);
  outline: 1px solid transparent;
}

.review-queue-card h2,
.review-queue-card p {
  margin: 0;
}

.review-queue-card h2 {
  font-family: var(--font-family-base);
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-medium);
}

.review-queue-card__heading {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-50, 8px);
}

.review-queue-card__heading h2 {
  min-width: 0;
}

.review-queue-card__description,
.review-queue-card__summary {
  margin-top: var(--spacing-50) !important;
}

.review-queue-card__editor {
  display: flex;
  align-items: center;
  gap: var(--spacing-25);
  margin-top: var(--spacing-50) !important;
}
</style>

<style scoped>
.review-changes-page__header { padding-inline: 16px; }
.review-changes-page__header--standalone { grid-template-columns: minmax(0, 1fr) auto; }
.review-changes-page__header--standalone .review-changes-page__title { justify-self: start; text-align: start; }
</style>

<style scoped>
.review-queue-card:not(:last-child)::after {
  content: '';
  position: absolute;
  inset-inline: 16px;
  bottom: 0;
  border-bottom: 1px solid var(--border-color-base, #a2a9b1);
}
.review-queue-card__description,
.review-queue-card__summary,
.review-queue-card__editor { color: var(--color-subtle, #54595d); }
.review-queue-card__description {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.review-queue-card__description,
.review-queue-card__summary {
  font-size: var(--font-size-medium, 1rem);
  line-height: var(--line-height-medium, 1.625rem);
}
.review-queue-card__editor {
  font-size: var(--font-size-small, 0.875rem);
  line-height: var(--line-height-small, 1.375rem);
}
.review-queue-card__editor :deep(.cdx-icon) { color: inherit; }
</style>
