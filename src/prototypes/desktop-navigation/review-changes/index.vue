<script setup lang="ts">
import { CdxButton, CdxCard, CdxDialog, CdxIcon, CdxToast } from '@wikimedia/codex'
import {
  cdxIconCheck,
  cdxIconClose,
  cdxIconEditUndo,
  cdxIconHeartOutline,
  cdxIconInfoFilled,
  cdxIconNext,
  cdxIconPrevious,
  cdxIconUserAvatar,
} from '@wikimedia/codex-icons'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import SpecialPageWrapper from '@/components/SpecialPageWrapper.vue'
import { useConfig } from '@/composables/useConfig'
import WikipediaDiffContent from './WikipediaDiffContent.vue'
import { reviewChanges } from '../reviewChanges'

const { pageTitle } = useConfig()
const activeReviewIndex = ref<number | null>(null)
const reviewedChanges = ref<Set<string>>(new Set())
const undoneChanges = ref<Set<string>>(new Set())
const thankedChanges = ref<Set<string>>(new Set())
const confirmationToast = ref('')

const activeReviewChange = computed(() => reviewChanges[activeReviewIndex.value ?? 0])

function openDiff(index: number): void {
  activeReviewIndex.value = index
}

function updateDiffOpen(open: boolean): void {
  if (!open) activeReviewIndex.value = null
}

function moveDiff(direction: -1 | 1): void {
  if (activeReviewIndex.value === null) return
  const next = activeReviewIndex.value + direction
  if (next >= 0 && next < reviewChanges.length) activeReviewIndex.value = next
}

function toggleReviewed(): void {
  const title = activeReviewChange.value.title
  const next = new Set(reviewedChanges.value)
  if (next.has(title)) {
    next.delete(title)
    confirmationToast.value = 'Edit marked as unreviewed on your dashboard only.'
  } else {
    next.add(title)
    confirmationToast.value = 'Edit marked as reviewed on your dashboard only.'
  }
  reviewedChanges.value = next
}

function toggleUndo(): void {
  const title = activeReviewChange.value.title
  const next = new Set(undoneChanges.value)
  if (next.has(title)) {
    next.delete(title)
    confirmationToast.value = 'Edit restored.'
  } else {
    next.add(title)
    confirmationToast.value = 'Your edit was saved.'
  }
  undoneChanges.value = next
}

function sendThanks(): void {
  const title = activeReviewChange.value.title
  if (thankedChanges.value.has(title)) {
    confirmationToast.value = 'A ‘Thanks’ cannot be undone.'
    return
  }
  thankedChanges.value = new Set(thankedChanges.value).add(title)
  confirmationToast.value = `You thanked ${activeReviewChange.value.editor}.`
}

definePage({
  meta: {
    title: 'Review changes — Desktop navigation',
    description: 'Complete Review Changes queue for the Desktop navigation prototype.',
  },
})
</script>

<template>
  <ChromeWrapper skin="desktop" :last-edited-notice="false">
    <SpecialPageWrapper :title="pageTitle" actions>
      <template #actions>
        <RouterLink to="/" class="review-changes-page__feedback">Share feedback</RouterLink>
      </template>

      <header class="review-changes-page__subheader">
        <RouterLink
          :to="{ path: '/desktop-navigation', query: { navigation: 'new-page' } }"
          class="review-changes-page__back-button"
          aria-label="Back to personal dashboard"
        >
          <CdxIcon :icon="cdxIconPrevious" />
        </RouterLink>
        <h2>Review changes</h2>
        <CdxButton
          weight="quiet"
          :icon-only="true"
          aria-label="About review changes"
          class="review-changes-page__info-button"
        >
          <CdxIcon :icon="cdxIconInfoFilled" />
        </CdxButton>
      </header>

      <div class="review-changes-page__list">
        <article
          v-for="(change, changeIndex) in reviewChanges"
          :key="change.title"
          class="review-changes-page__item"
          role="button"
          tabindex="0"
          @click="openDiff(changeIndex)"
          @keydown.enter.prevent="openDiff(changeIndex)"
          @keydown.space.prevent="openDiff(changeIndex)"
        >
          <CdxCard>
            <template #title>{{ change.title }}</template>
            <template v-if="change.description" #description>{{ change.description }}</template>
            <template #supporting-text>
              <span class="review-changes-page__supporting-text">
                <span class="review-changes-page__meta">
                  <CdxIcon :icon="cdxIconUserAvatar" size="x-small" />
                  <span class="review-changes-page__username">{{ change.editor }}</span>
                  <span>· {{ change.time }}</span>
                </span>
                <span class="review-changes-page__summary">{{ change.summary }}</span>
              </span>
            </template>
          </CdxCard>
        </article>
      </div>

      <CdxDialog
        :open="activeReviewIndex !== null"
        :title="activeReviewChange.title"
        :subtitle="`Revision from ${activeReviewChange.revisionDate} (UTC)`"
        class="new-page-diff-dialog"
        @update:open="updateDiffOpen"
      >
        <template #header>
          <div class="new-page-diff-dialog__header">
            <div class="new-page-diff-dialog__heading">
              <h2>{{ activeReviewChange.title }}</h2>
              <p>Revision from {{ activeReviewChange.revisionDate }} (UTC)</p>
            </div>
            <CdxButton
              weight="quiet"
              :icon-only="true"
              aria-label="Close"
              @click="updateDiffOpen(false)"
            >
              <CdxIcon :icon="cdxIconClose" />
            </CdxButton>
          </div>
        </template>

        <div class="new-page-diff-dialog__meta">
          <span class="new-page-diff-dialog__user">
            <CdxIcon :icon="cdxIconUserAvatar" size="small" />
            {{ activeReviewChange.editor }}
          </span>
          <CdxButton weight="quiet">Full diff</CdxButton>
        </div>
        <div class="new-page-diff-dialog__diff">
          <WikipediaDiffContent :change="activeReviewChange" tall :show-heading="false" />
        </div>
        <div class="new-page-diff-dialog__footer">
          <CdxButton size="medium" @click="sendThanks">
            <CdxIcon :icon="cdxIconHeartOutline" />
            {{ thankedChanges.has(activeReviewChange.title) ? 'Thanked' : 'Thank' }}
          </CdxButton>
          <CdxButton size="medium" @click="toggleUndo">
            <CdxIcon :icon="cdxIconEditUndo" />
            {{ undoneChanges.has(activeReviewChange.title) ? 'Restore' : 'Undo' }}
          </CdxButton>
          <CdxButton size="medium" @click="toggleReviewed">
            <CdxIcon :icon="cdxIconCheck" />
            {{ reviewedChanges.has(activeReviewChange.title) ? 'Reviewed' : 'Review' }}
          </CdxButton>
          <div class="new-page-diff-dialog__navigation">
            <CdxButton
              size="small"
              :icon-only="true"
              aria-label="Previous review change"
              :disabled="activeReviewIndex === 0"
              @click="moveDiff(-1)"
            >
              <CdxIcon :icon="cdxIconPrevious" />
            </CdxButton>
            <CdxButton
              size="small"
              :icon-only="true"
              aria-label="Next review change"
              :disabled="activeReviewIndex === reviewChanges.length - 1"
              @click="moveDiff(1)"
            >
              <CdxIcon :icon="cdxIconNext" />
            </CdxButton>
          </div>
        </div>
      </CdxDialog>

      <CdxToast
        v-if="confirmationToast"
        standalone
        type="success"
        :auto-dismiss="true"
        @auto-dismissed="confirmationToast = ''"
        @user-dismissed="confirmationToast = ''"
      >
        {{ confirmationToast }}
      </CdxToast>
    </SpecialPageWrapper>
  </ChromeWrapper>
</template>

<style scoped>
.review-changes-page__feedback {
  color: var(--color-progressive, #36c);
  text-decoration: none;
}

.review-changes-page__feedback:hover {
  text-decoration: underline;
}

:deep(.special-page-wrapper__header) {
  max-width: 960px;
  margin-inline: auto;
  margin-bottom: 0;
}

.review-changes-page__subheader {
  display: flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
  width: 100%;
  max-width: 960px;
  margin: 0 auto var(--spacing-100, 16px);
  padding: var(--spacing-50, 8px) 0;
  border-bottom: 1px solid var(--border-color-subtle, #c8ccd1);
}

.review-changes-page__subheader h2 {
  margin: 0;
  padding: 0;
  border: 0;
  font-family: var(--font-family-system-sans, system-ui, sans-serif);
  font-size: var(--font-size-large, 1.125rem);
  font-weight: var(--font-weight-bold, 700);
  line-height: var(--line-height-small, 1.375rem);
}

.review-changes-page__back-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--color-base, #202122);
  text-decoration: none;
}

.review-changes-page__back-button:hover {
  background: var(--background-color-interactive-subtle--hover, #eaecf0);
}

.review-changes-page__info-button {
  margin-inline-start: auto;
}

.review-changes-page__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50, 8px);
  width: 100%;
  max-width: 960px;
  margin-inline: auto;
}

.review-changes-page__item,
.review-changes-page__item .cdx-card {
  width: 100%;
  min-width: 0;
}

.review-changes-page__item {
  cursor: pointer;
}

.review-changes-page__item:hover .cdx-card {
  border-color: var(--border-color-interactive--hover, #27292d);
}

.review-changes-page__item:focus-visible {
  outline: 2px solid var(--color-progressive, #36c);
  outline-offset: 2px;
}

:deep(.review-changes-page__item .cdx-card__text) {
  width: 100%;
  min-width: 0;
}

.review-changes-page__supporting-text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-25, 4px);
}

.review-changes-page__meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-25, 4px);
}

.review-changes-page__username {
  color: var(--color-progressive, #36c);
  font-weight: var(--font-weight-bold, 700);
}

.review-changes-page__summary {
  color: var(--color-subtle, #54595d);
}

.new-page-diff-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-50, 8px);
  width: 100%;
}

.new-page-diff-dialog__heading {
  min-width: 0;
}

.new-page-diff-dialog__heading h2 {
  margin: 0;
  padding: 0;
  border: 0;
  font-family: var(--font-family-system-sans, system-ui, sans-serif);
  font-size: var(--font-size-large, 1.125rem);
  font-weight: var(--font-weight-bold, 700);
  line-height: var(--line-height-small, 1.375rem);
}

.new-page-diff-dialog__heading p {
  margin: var(--spacing-25, 4px) 0 0;
  color: var(--color-subtle, #54595d);
  font-size: var(--font-size-small, 0.875rem);
  line-height: var(--line-height-small, 1.375rem);
}

.new-page-diff-dialog__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: calc(var(--spacing-100, 16px) * -1) -24px 0;
  padding: var(--spacing-75, 12px) var(--spacing-100, 16px);
  border-bottom: 1px solid var(--border-color-subtle, #c8ccd1);
}

.new-page-diff-dialog__user {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-25, 4px);
  color: var(--color-progressive, #36c);
  font-weight: var(--font-weight-bold, 700);
}

.new-page-diff-dialog__diff {
  margin-inline: -24px;
}

.new-page-diff-dialog__footer {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
  gap: var(--spacing-50, 8px);
  margin: 0 -24px -24px;
  padding: var(--spacing-75, 12px) var(--spacing-100, 16px);
  border-top: 1px solid var(--border-color-subtle, #c8ccd1);
  background: var(--background-color-base, #fff);
}

.new-page-diff-dialog__footer > .cdx-button {
  justify-content: center;
  font-weight: var(--font-weight-bold, 700);
}

.new-page-diff-dialog__navigation {
  display: flex;
  gap: var(--spacing-50, 8px);
}

:deep(.new-page-diff-dialog .cdx-dialog__frame) {
  width: min(512px, calc(100vw - 32px));
}

:deep(.new-page-diff-dialog .cdx-dialog__body) {
  overflow: hidden;
}
</style>
