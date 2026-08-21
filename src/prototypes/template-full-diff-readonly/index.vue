<script setup lang="ts">
import { CdxButton, CdxDialog, CdxIcon } from '@wikimedia/codex'
import { cdxIconArrowPrevious } from '@wikimedia/codex-icons'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useGermanPrototype } from '@/composables/useGermanPrototype'
import { germanReviewChanges } from '../germanReviewChanges'

import WikipediaDiffContent from '../template-dashboard/review-changes/WikipediaDiffContent.vue'
import { reviewChanges } from '../template-dashboard/reviewChanges'

definePage({
  meta: {
    title: 'Full diff preview',
    description: 'Read-only full visual diff for dashboard prototypes.',
  },
})

const route = useRoute()
const isGerman = computed(() => route.query.lang === 'de')
if (route.query.lang === 'de') useGermanPrototype()
const requestedTitle = computed(() => String(route.query.title || ''))
const warningOpen = ref(true)
const change = computed(
  () => {
    const changes = isGerman.value ? germanReviewChanges : reviewChanges
    return changes.find((item) => item.title === requestedTitle.value) ?? changes[0]
  },
)

function goBack(): void {
  window.close()
  window.setTimeout(() => {
    if (!window.closed) window.history.back()
  }, 0)
}

function openWikipedia(): void {
  const title = encodeURIComponent(change.value.title.replaceAll(' ', '_'))
  window.location.href =
    `https://${change.value.wikiHost ?? 'en.wikipedia.org'}/w/index.php?title=${title}` +
    `&diff=${change.value.revisionId}` +
    `&oldid=${change.value.oldRevisionId}&diffmode=visual`
}
</script>

<template>
  <main class="readonly-diff-page">
    <header class="readonly-diff-page__header">
      <CdxButton weight="quiet" :icon-only="true" aria-label="Back to prototype" @click="goBack">
        <CdxIcon :icon="cdxIconArrowPrevious" />
      </CdxButton>
      <strong>Full diff</strong>
    </header>

    <article class="readonly-diff-page__content">
      <header class="readonly-diff-page__title">
        <h1>{{ change.title }}</h1>
        <p>Difference between revisions</p>
      </header>

      <section class="readonly-diff-page__meta">
        <strong>{{ change.editor }}</strong>
        <span>Revision from: {{ change.revisionDate }} (UTC)</span>
      </section>

      <WikipediaDiffContent :change="change" tall />
    </article>

    <CdxDialog
      :open="warningOpen"
      title="Opening Wikipedia"
      class="wikipedia-warning-dialog"
      @update:open="warningOpen = $event"
    >
      <p>You are leaving the prototype and opening Wikipedia. Any edits or action made there are public</p>
      <div class="wikipedia-warning-dialog__actions">
        <CdxButton action="progressive" weight="primary" @click="openWikipedia">Got it</CdxButton>
      </div>
    </CdxDialog>
  </main>
</template>

<style scoped>
.readonly-diff-page {
  min-height: 100vh;
  color: var(--color-base, #202122);
  background: var(--background-color-base, #fff);
}

.readonly-diff-page__header {
  position: sticky;
  z-index: 1;
  top: 0;
  display: flex;
  gap: 12px;
  align-items: center;
  min-height: 46px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border-color-subtle, #c8ccd1);
  background: var(--background-color-base, #fff);
}

.readonly-diff-page__content {
  box-sizing: border-box;
  width: min(100%, 1100px);
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.readonly-diff-page__title {
  margin-top: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color-subtle, #c8ccd1);
}

.wikipedia-warning-dialog p {
  margin: 0;
  font-size: var(--font-size-medium, 1rem);
  line-height: 1.6;
}

.wikipedia-warning-dialog__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

.readonly-diff-page__title h1 {
  margin: 0 0 4px;
  font-family: Georgia, serif;
  font-size: 2rem;
  line-height: 1.2;
}

.readonly-diff-page__title p,
.readonly-diff-page__meta span {
  margin: 0;
  color: var(--color-subtle, #54595d);
}

.readonly-diff-page__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 16px 0;
}

@media (min-width: 720px) {
  .readonly-diff-page__content {
    padding: 32px;
  }
}
</style>
