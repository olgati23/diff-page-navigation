<script setup lang="ts">
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconEllipsis, cdxIconUserAvatar, cdxIconInfo } from '@wikimedia/codex-icons'
import { RouterLink, useRoute } from 'vue-router'
import { compactTime } from '../compactTime'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import type { ReviewChange } from '../../template-dashboard-desktop-modal/reviewChanges'
defineProps<{ edits: ReviewChange[] }>()
const route = useRoute()
const queueLink = (title?: string) => ({ path: '/review-changes/', query: { ...route.query, view: undefined, previewTitle: title } })
</script>
<template>
  <ChromeWrapper skin="mobile" :last-edited-notice="false">
    <main class="dashboard-home">
      <h1>Hello, $Username!</h1>
      <nav class="home-tabs" aria-label="Personal pages"><span aria-current="page">Home</span><a href="https://en.wikipedia.org/wiki/Special:MyPage">User page</a><a href="https://en.wikipedia.org/wiki/Special:MyTalk">Talk</a></nav>
      <section>
        <header><h2>Review changes</h2><RouterLink :to="queueLink()" aria-label="More review changes"><CdxIcon :icon="cdxIconEllipsis" /></RouterLink></header>
        <div class="home-edit-list">
        <RouterLink v-for="edit in edits.slice(0, 3)" :key="edit.title" :to="queueLink(edit.title)" class="home-edit">
          <strong>{{ edit.title }}</strong><p>{{ edit.description }}</p><p class="summary">{{ edit.summary || 'No edit summary' }}</p>
          <div class="edit-meta"><span><CdxIcon :icon="cdxIconUserAvatar" size="small" />{{ edit.editor }}</span><span>{{ compactTime(edit.time) }}</span></div>
        </RouterLink>
        </div>
        <RouterLink :to="queueLink()" class="show-more"><CdxButton tabindex="-1">Show more</CdxButton></RouterLink>
      </section>
      <section class="discussions"><header><h2>Active discussions</h2><CdxIcon :icon="cdxIconInfo" icon-label="About active discussions" /></header><a class="discussion" href="https://en.wikipedia.org/wiki/Wikipedia:Village_pump">Wikipedia community discussions</a></section>
    </main>
  </ChromeWrapper>
</template>
<style scoped>
.dashboard-home { padding: 24px 16px; background: #fff; min-height: calc(100dvh - 56px); color: var(--color-base); }
h1 { font: normal 30px/1.3 var(--font-family-serif, Georgia, serif); margin: 0 0 12px; border: 0; padding: 0; }
.home-tabs { display: flex; gap: 16px; border-bottom: 1px solid var(--border-color-base); margin-bottom: var(--spacing-100, 16px); font-weight: 700; }
.home-tabs > * { color: var(--color-subtle); padding-bottom: 6px; }
.home-tabs [aria-current] { border-bottom: 2px solid var(--color-subtle); }
header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
h2 { font: bold 18px/26px var(--font-family-base); margin: 0; border: 0; padding: 0; }
.home-edit-list { display: flex; flex-direction: column; gap: var(--spacing-50, 8px); margin-bottom: 8px; }
.home-edit { display: block; border: 1px solid var(--border-color-base); padding: 12px; margin: 0; color: var(--color-base); font-size: 16px; line-height: 22px; text-decoration: none; }
.home-edit p { margin: 0; color: var(--color-subtle); }
.home-edit .summary { margin: 6px 0 12px; font-style: italic; color: var(--color-base); }
.edit-meta { display: flex; justify-content: space-between; gap: 12px; color: var(--color-subtle); font-size: 14px; }
.edit-meta span:first-child { display: flex; align-items: center; min-width: 0; }
.edit-meta span:last-child { white-space: nowrap; }
.show-more { display: block; }.show-more :deep(button) { width: 100%; max-width: none; }
.discussions { margin-top: 36px; }.discussion { display: block; padding: 12px; border: 1px solid var(--border-color-base); color: var(--color-base); font-weight: 700; }
</style>
