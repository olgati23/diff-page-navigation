<script setup lang="ts">
import ReviewChangesMenu from './ReviewChangesMenu.vue'
import { inject, ref, onMounted, onBeforeUnmount } from 'vue'
import { CdxButton, CdxIcon, CdxMenuButton } from '@wikimedia/codex'
import { cdxIconConfigure, cdxIconEllipsis, cdxIconUserAvatar, cdxIconMessage, cdxIconUserTalk, cdxIconCheck, cdxIconCollapse } from '@wikimedia/codex-icons'
import { RouterLink, useRoute } from 'vue-router'
import { customizeDiffKey } from '../customizeDiff'
import { compactTime } from '../compactTime'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import type { ReviewChange } from '../../template-dashboard-desktop-modal/reviewChanges'
defineProps<{ edits: ReviewChange[] }>()
const route = useRoute()
const customizeDiff = inject(customizeDiffKey, null)
const customizeSelection = ref(null)
const desktop = ref(window.innerWidth >= 800)
const resize = () => { desktop.value = window.innerWidth >= 800 }
onMounted(() => window.addEventListener('resize', resize))
onBeforeUnmount(() => window.removeEventListener('resize', resize))
const editLimit = ref(3)
const discussionLimit = ref(3)
const discussions = [
  ['Branded Wikilove templates', 'Wikipedia:Village pump (proposals)', '8', '4', '10h ago'],
  ['Newcomer tasks', 'Wikipedia:Village pump (miscellaneous)', '138', '18', '2h ago'],
  ['Addition to specialized characters in the editor?', 'Wikipedia:Help desk', '3', '3', '4h ago'],
  ['Improving newcomer support', 'Wikipedia:Village pump (ideas)', '12', '6', '1h ago'],
  ['Article sourcing questions', 'Wikipedia:Teahouse', '7', '4', '3h ago'],
  ['Editing tools feedback', 'Wikipedia:Village pump (technical)', '21', '9', '5h ago'],
]
const policies = [
  ['Neutral point of view', 'Content must represent significant views fairly, proportionately and without bias.'],
  ['No original research', 'Articles should summarise published sources, and not contain users’ own interpretation or knowledge.'],
  ['Verifiability', 'New additions should include a citation, providing the source of the information.'],
  ['Assume good faith', 'Remember that most users are trying to improve Wikipedia and not deliberately reduce its quality.'],
]
const queueLink = (title?: string) => ({ path: '/review-changes/', query: { ...route.query, view: 'queue', previewTitle: title } })
</script>
<template>
  <ChromeWrapper :skin="desktop ? 'desktop' : 'mobile'" :last-edited-notice="false" :show-footer="false">
    <main class="dashboard-home">
      <h1>Hello, $Username!</h1>
      <nav class="home-tabs" aria-label="Personal pages"><span aria-current="page">Home</span><a href="https://en.wikipedia.org/wiki/Special:MyPage">User page</a><a href="https://en.wikipedia.org/wiki/Special:MyTalk">Talk</a></nav>
      <div class="dashboard-grid"><div class="dashboard-primary"><section>
        <header><h2>Review changes</h2><ReviewChangesMenu /></header>
        <div class="home-edit-list">
        <RouterLink v-for="edit in edits.slice(0, editLimit)" :key="edit.title" :to="queueLink(edit.title)" class="home-edit">
          <strong>{{ edit.title }}</strong><p>{{ edit.description }}</p><p class="summary">{{ edit.summary || 'No edit summary' }}</p>
          <div class="edit-meta"><span><CdxIcon :icon="cdxIconUserAvatar" size="small" />{{ edit.editor }}</span><span>{{ compactTime(edit.time) }}</span></div>
        </RouterLink>
        </div>
        <div class="list-actions">
          <CdxButton v-if="editLimit < edits.length" class="show-cards" @click="editLimit = desktop ? edits.length : editLimit + 3">Show more</CdxButton>
          <CdxButton v-if="editLimit > 3" class="collapse-cards" weight="quiet" aria-label="Collapse all cards" @click="editLimit = 3"><CdxIcon :icon="cdxIconCollapse" /></CdxButton>
        </div>
      </section>
      <section class="active-discussions">
        <header><h2>Active discussions</h2><CdxButton weight="quiet" aria-label="More discussion options" @click="discussionLimit = discussionLimit === 3 ? discussions.length : 3"><CdxIcon :icon="cdxIconEllipsis" /></CdxButton></header>
        <div class="home-edit-list">
          <a v-for="discussion in discussions.slice(0, discussionLimit)" :key="discussion[0]" class="home-edit discussion-card" :href="'https://en.wikipedia.org/wiki/' + encodeURIComponent(discussion[1].replaceAll(' ', '_'))" target="_blank" rel="noopener noreferrer">
            <strong>{{ discussion[0] }}</strong><p>{{ discussion[1] }}</p>
            <div class="discussion-meta"><span><CdxIcon :icon="cdxIconMessage" size="small" /> {{ discussion[2] }} <CdxIcon :icon="cdxIconUserAvatar" size="small" /> {{ discussion[3] }}</span><span>{{ discussion[4] }}</span></div>
          </a>
        </div>
        <div class="list-actions">
          <CdxButton v-if="discussionLimit < discussions.length" class="show-cards" @click="discussionLimit = desktop ? discussions.length : discussionLimit + 3">Show more</CdxButton>
          <CdxButton v-if="discussionLimit > 3" class="collapse-cards" weight="quiet" aria-label="Collapse all discussion cards" @click="discussionLimit = 3"><CdxIcon :icon="cdxIconCollapse" /></CdxButton>
        </div>
      </section></div>
      <aside class="dashboard-sidebar">
        <section><header><h2>Your impact</h2></header><div class="impact"><div><strong><CdxIcon :icon="cdxIconUserTalk" /> <a href="https://en.wikipedia.org/wiki/Special:Log/thanks">3</a></strong><p>Thanks sent</p></div><div><strong><CdxIcon :icon="cdxIconCheck" /> 62</strong><p>Edits reviewed ⓘ</p></div></div></section>
        <section><header><h2>Policies and guidelines</h2><span aria-label="Information">ⓘ</span></header><details v-for="policy in policies" :key="policy[0]" open><summary>{{ policy[0] }}</summary><p>{{ policy[1] }}</p></details></section>
      </aside></div>
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

.dashboard-primary { min-width: 0; }
.active-discussions { margin-top: 32px; }
.discussion-card strong { display: block; margin-bottom: 8px; }
.discussion-meta { display: flex; justify-content: space-between; gap: 12px; margin-top: 16px; color: var(--color-subtle); }
.discussion-meta > span:first-child { display: flex; align-items: center; gap: 6px; }
.discussion-meta > span:last-child { white-space: nowrap; }
.discussion-more { width: 100%; max-width: none; }
.list-actions { display: flex; width: 100%; align-items: center; justify-content: space-between; }
.list-actions .show-cards { width: 100%; max-width: none; }
.collapse-cards { margin-inline-start: auto; flex-shrink: 0; }
.dashboard-sidebar { display: none; }
@media (min-width: 800px) {
  .discussion-more { width: auto; }
  .dashboard-home { padding: 24px 44px 30px; max-width: 1600px; margin: auto; }
  h1 { border-bottom: 1px solid var(--border-color-base); margin-bottom: 24px; }
  .home-tabs { display: none; }
  .dashboard-grid { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 32px; }
  h2 { font-size: 16px; line-height: 24px; }
  .home-edit { font-size: 14px; line-height: 20px; }
  .edit-meta { font-size: 12px; }
  .list-actions .show-cards { width: auto; }
  .dashboard-sidebar { display: block; }
  .dashboard-sidebar section + section { margin-top: 24px; }
  .impact { display: grid; grid-template-columns: 1fr 1fr; padding: 4px; }
  .impact > div { padding: 0 16px; }
  .impact > div + div { border-left: 1px solid var(--border-color-subtle); }
  .impact strong { display: flex; align-items: center; gap: 8px; font-size: 14px; }
  .impact p { color: var(--color-subtle); font-size: 14px; margin: 10px 0 0; }
  details { padding: 12px; border-bottom: 1px solid var(--border-color-subtle); }
  details:last-child { border-bottom: 0; }
  summary { cursor: pointer; font-weight: 700; }
  details p { margin: 0 0 0 22px; color: var(--color-subtle); line-height: 22px; }
}
</style>
