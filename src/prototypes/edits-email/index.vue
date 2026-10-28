<script setup lang="ts">
import { ref } from 'vue'
import { CdxButton, CdxCard, CdxIcon, CdxMenuButton } from '@wikimedia/codex'
import { cdxIconPrevious, cdxIconDownload, cdxIconTrash, cdxIconMessage, cdxIconEllipsis, cdxIconStar, cdxIconUserAvatar, cdxIconUndo, cdxIconShare } from '@wikimedia/codex-icons'
definePage({ meta: { title: 'New edits email', description: 'Contribution digest linking to Wikipedia page history.' } })
const starred = ref(false)
const version = ref('A')
const loadingPage = ref('')
const error = ref('')
const historyUrl = (page: string) => 'https://en.wikipedia.org/w/index.php?title=' + encodeURIComponent(page) + '&action=history'
const reviewEdits = async (page: string) => {
  if (version.value === 'A') { window.location.href = historyUrl(page); return }
  loadingPage.value = page
  error.value = ''
  try {
    const params = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', origin: '*', prop: 'revisions', titles: page, rvprop: 'ids', rvlimit: '5' })
    const response = await fetch('https://en.wikipedia.org/w/api.php?' + params, { signal: AbortSignal.timeout(15000) })
    if (!response.ok) throw new Error('Unable to load revisions')
    const data = await response.json()
    const revisions = data.query?.pages?.[0]?.revisions
    if (revisions?.length !== 5 || !revisions[4].parentid) throw new Error('Missing revision history')
    window.location.href = 'https://en.wikipedia.org/w/index.php?' + new URLSearchParams({ title: page, oldid: String(revisions[4].parentid), diff: String(revisions[0].revid) })
  } catch {
    error.value = 'Could not load the latest five edits. Please try again or open Page history.'
  } finally { loadingPage.value = '' }
}
const articles = [
{title:'Bamboo',page:'Bamboo',edits:14,people:3,views:'233',image:'Bamboo forest.jpg'},
{title:'Racoon',page:'Raccoon',edits:10,people:5,views:'3,267',image:'Raccoon in Central Park (35264).jpg'},
{title:'Giant panda',page:'Giant_panda',edits:7,people:2,views:'2,341',image:'Grosser Panda.JPG'}]
</script>
<template>
<main class="email-demo" data-theme="light"><div class="screen">
<div class="status" aria-hidden="true"><span>✈ ▰</span><strong>14:02</strong><span>89 % ▰</span></div>
<div class="toolbar"><CdxIcon :icon="cdxIconPrevious" aria-hidden="true"/><div><CdxIcon v-for="icon in [cdxIconDownload,cdxIconTrash,cdxIconMessage]" :icon="icon" aria-hidden="true"/><CdxMenuButton v-model:selected="version" :menu-items="[{value:'A',label:'Version A'},{value:'B',label:'Version B'}]" weight="quiet" aria-label="Switch prototype version"><CdxIcon :icon="cdxIconEllipsis"/></CdxMenuButton></div></div>
<header class="subject"><h1>New edits to articles<br>you’ve edited <small>Inbox</small></h1><CdxButton weight="quiet" aria-label="Star email" :aria-pressed="starred" @click="starred=!starred"><span v-if="starred">★</span><CdxIcon v-else :icon="cdxIconStar"/></CdxButton></header>
<article class="mail"><header class="sender"><span class="avatar"><CdxIcon :icon="cdxIconUserAvatar"/></span><div>Wikipedia <time>13. Oct</time><br><span class="muted">to me⌄</span></div><span class="unsubscribe">Unsubscribe</span><CdxIcon :icon="cdxIconEllipsis"/></header>
<img class="logo" src="https://upload.wikimedia.org/wikipedia/en/8/80/Wikipedia-logo-v2.svg" alt="Wikipedia" width="50" height="50">
<p class="intro">Hello $Username,<br>In the past week, 31 new edits have been made to all of the articles you've contributed to. Review the latest changes to the most edited articles and see where you can make further improvements.</p>
<h2>New contributions in</h2>
<CdxCard v-for="a in articles" :key="a.page" class="article-card" :class="{ 'article-card--b': version === 'B' }" :thumbnail="{ url: 'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(a.image)+'?width=80' }" :aria-label="a.title">
  <template #title>{{ a.title }}</template>
  <template #description><strong>{{ a.edits }} new</strong> edits by {{ a.people }} contributors<br>{{ a.views }} views since your edit</template>
  <template #supporting-text><span class="card-actions"><CdxButton class="review" size="medium" action="default" weight="normal" :disabled="!!loadingPage" :aria-label="'Review edits: '+a.title+(version === 'A' ? ' page history' : ' latest five edits')" @click="reviewEdits(a.page)">{{ loadingPage === a.page ? 'Loading…' : 'Review edits' }}</CdxButton><a v-if="version === 'B'" :href="historyUrl(a.page)" class="history-link">Visit page history</a></span></template>
</CdxCard>
<p v-if="error" role="alert" class="review-error">{{ error }}</p>
<p class="thank-you">Thank you for contributing to Wikipedia!<br>Your edits support free knowledge that is viewed nearly 13 billion times every month.</p>
<div class="muted">--</div><p class="preferences">To control which emails we send you, check your <a href="https://en.wikipedia.org/wiki/Special:Preferences#mw-prefsection-personal-email">preferences</a>.</p>
</article><footer><div class="reply" aria-hidden="true"><span><CdxIcon :icon="cdxIconUndo"/>Reply</span><span><CdxIcon :icon="cdxIconShare"/>Forward</span><span class="reaction"><svg class="smile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r=".7" fill="currentColor"/><circle cx="15" cy="10" r=".7" fill="currentColor"/><path d="M8 14c1.5 3 6.5 3 8 0" stroke-linecap="round"/></svg></span></div></footer>
</div></main>
</template>
<style scoped>
.email-demo{min-height:100vh;background:#eef3f9;color:var(--color-base);font-family:Arial,sans-serif}.screen{max-width:375px;margin:auto}.status{height:26px;display:flex;justify-content:space-between;padding:0 8px;align-items:center;font-size:12px;color:#000}.toolbar{display:flex;justify-content:space-between;padding:4px 16px 4px 8px;height:34px}.toolbar>div{display:flex;gap:26px;align-items:center}.toolbar :deep(.cdx-menu-button){margin:-6px -8px -6px -8px}.card-actions{display:flex;align-items:center;flex-wrap:wrap;gap:var(--spacing-75)}.article-card--b :deep(.cdx-card__text__title){font-size:var(--font-size-small);line-height:var(--line-height-small)}.article-card--b :deep(.cdx-card__text__description){font-size:var(--font-size-small);line-height:var(--line-height-small);margin-top:var(--spacing-25)}.article-card--b .card-actions{margin-top:var(--spacing-50)}.article-card--b .review{margin-top:0}.review-error{color:var(--color-destructive);font-size:var(--font-size-small)}.subject{display:flex;justify-content:space-between;align-items:center;padding:6px 18px 12px 24px}.subject h1{font:400 23px/30px Arial,sans-serif;margin:0;border:0}.subject small{font-size:12px;color:#254da4;background:#d5e3ff;padding:3px 4px;vertical-align:middle;border-radius:2px}.mail{margin:0 8px;background:var(--background-color-base);border-radius:17px 17px 32px 32px;padding:16px}.sender{display:flex;gap:12px;align-items:center;font-size:13px;margin-bottom:42px;line-height:19px}.sender>div{flex:1;white-space:nowrap}.sender time{font-size:12px;margin-left:7px;color:var(--color-subtle)}.avatar{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:#eaecf0;color:#a2a9b1}.avatar .cdx-icon{width:28px;height:28px}.unsubscribe{font-size:13px;color:var(--color-progressive)}.muted{color:var(--color-subtle)}.logo{display:block;margin-bottom:12px;object-fit:contain}.intro{font-size:16px;line-height:26px;margin:0 0 23px}h2{font:700 16px/22px Arial,sans-serif;margin:0 0 9px}.article-card{margin-bottom:var(--spacing-75)}h3{font:700 16px/22px Arial,sans-serif;margin:0 0 4px}.review{margin-top:var(--spacing-50)}.thank-you{font-size:16px;line-height:26px;margin:24px 0 8px}.preferences{color:var(--color-subtle);font-family:var(--font-family-base);font-size:var(--font-size-x-small);font-weight:var(--font-weight-normal);line-height:var(--line-height-x-small);margin:12px 0 15px}footer{padding:24px 8px 8px}.reply{display:flex;gap:4px;align-items:center}.reply > span{height:46px;display:flex;justify-content:center;align-items:center;gap:12px;border:0;background:#00689b;color:white;border-radius:24px;font-size:14px;flex:1}.reply .cdx-icon{color:inherit;width:16px;height:16px}.reply .reaction{flex:0 0 36px;height:36px}.reply .reaction .smile-icon{width:20px;height:20px}@media(min-width:600px){.email-demo{padding:32px 0}.screen{box-shadow:0 8px 40px #20212218;border-radius:24px;overflow:hidden}}@media(max-width:350px){.article-card{margin-bottom:var(--spacing-75)}.sender{gap:6px}}

.article-card--b{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:var(--spacing-75)}
.article-card--b :deep(.cdx-card__text){display:contents}
.article-card--b :deep(.cdx-card__thumbnail){grid-column:1;grid-row:1 / 3}
.article-card--b :deep(.cdx-card__text__title),.article-card--b :deep(.cdx-card__text__description){grid-column:2}
.article-card--b :deep(.cdx-card__text__supporting-text){grid-column:2}
.article-card--b .card-actions{flex-direction:column;align-items:flex-start;gap:var(--spacing-50)}.history-link{font-size:var(--font-size-small);line-height:var(--line-height-small)}
.article-card--b .card-actions :deep(.cdx-button){white-space:nowrap}
</style>
