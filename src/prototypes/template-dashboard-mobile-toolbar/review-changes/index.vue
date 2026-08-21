<script setup lang="ts">
import { CdxIcon } from '@wikimedia/codex'
import { cdxIconArrowPrevious, cdxIconCheck, cdxIconEditUndo, cdxIconInfoFilled, cdxIconUserAvatar } from '@wikimedia/codex-icons'
import { RouterLink } from 'vue-router'
import { computed, ref } from 'vue'

import { reviewChanges, type ReviewChange } from '../reviewChanges'
import DiffPreviewModal from './DiffPreviewModal.vue'

definePage({
  meta: {
    title: 'Review changes',
    description: 'Detailed review queue for the dashboard template.',
  },
})

const previewVariant = ref<'card' | 'toolbar' | 'simplified'>('toolbar')
const selectedChangeIndex = ref<number | null>(null)
const reviewedChanges = ref<Set<string>>(new Set())
const undoneChanges = ref<Set<string>>(new Set())
const selectedChange = computed(() =>
  selectedChangeIndex.value === null ? null : reviewChanges[selectedChangeIndex.value],
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

function openDiff(change: ReviewChange) {
  selectedChangeIndex.value = reviewChanges.indexOf(change)
}

function navigateDiff(direction: -1 | 1) {
  if (selectedChangeIndex.value === null) return
  const nextIndex = selectedChangeIndex.value + direction
  if (nextIndex >= 0 && nextIndex < reviewChanges.length) {
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
</script>

<template>
  <main class="review-changes-page">
    <template v-if="!selectedChange">
    <header class="review-changes-page__header">
      <RouterLink to="/template-dashboard-mobile-toolbar" class="review-changes-page__back" aria-label="Back to dashboard">
        <CdxIcon :icon="cdxIconArrowPrevious" />
      </RouterLink>
      <h1 class="review-changes-page__title">Review changes</h1>
      <CdxIcon :icon="cdxIconInfoFilled" aria-label="About review changes" />
    </header>

    <section class="review-changes-page__list" aria-label="Suggested changes to review">
      <article
        v-for="change in reviewChanges"
        :key="change.title"
        class="review-queue-card"
        role="button"
        tabindex="0"
        :aria-label="`Preview changes to ${change.title}`"
        @click="openDiff(change)"
        @keydown.enter="openDiff(change)"
        @keydown.space.prevent="openDiff(change)"
      >
        <div class="review-queue-card__heading">
          <h2>{{ change.title }}</h2>
          <CdxIcon
            v-if="undoneChanges.has(change.title)"
            :icon="cdxIconEditUndo"
            size="small"
            class="review-queue-card__undone-status"
            icon-label="Edit undone"
          />
          <CdxIcon
            v-else-if="reviewedChanges.has(change.title)"
            :icon="cdxIconCheck"
            size="small"
            class="review-queue-card__reviewed-status"
            icon-label="Edit reviewed"
          />
        </div>
        <p class="review-queue-card__description">{{ change.description }}</p>
        <p class="review-queue-card__editor">
          <CdxIcon :icon="cdxIconUserAvatar" size="small" aria-hidden="true" />
          {{ change.editor }} · {{ change.time }}
        </p>
        <p class="review-queue-card__summary">{{ change.summary }}</p>
      </article>
    </section>
    </template>

    <DiffPreviewModal
      v-if="selectedChange"
      :key="previewVariant"
      :change="selectedPreviewChange!"
      :variant="previewVariant"
      :change-index="selectedChangeIndex ?? 0"
      :change-count="reviewChanges.length"
      :reviewed="reviewedChanges.has(selectedChange.title)"
      page
      @navigate="navigateDiff"
      @reviewed="markReviewed"
      @undone="markUndone"
      @close="selectedChangeIndex = null"
    />
  </main>
</template>

<style scoped>
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
  gap: var(--spacing-25);
  padding: var(--spacing-25);
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
  padding: var(--spacing-100);
  background: var(--background-color-base);
  border: var(--border-subtle);
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

.review-queue-card__reviewed-status {
  flex-shrink: 0;
  margin-inline-start: auto;
  color: var(--color-icon-base, #202122);
}

.review-queue-card__undone-status {
  flex-shrink: 0;
  margin-inline-start: auto;
  color: var(--color-icon-base, #202122);
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
