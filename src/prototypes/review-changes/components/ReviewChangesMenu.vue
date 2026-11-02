<script setup lang="ts">
import { inject, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { CdxDialog, CdxIcon, CdxMenuButton, CdxPopover, CdxToggleSwitch } from '@wikimedia/codex'
import { cdxIconAppearance, cdxIconConfigure, cdxIconEllipsis } from '@wikimedia/codex-icons'
import { customizeDiffKey } from '../customizeDiff'
const customize = inject(customizeDiffKey, null)
const selected = ref(null)
const dialog = ref('')
const menuAnchor = ref(null)
const desktop = ref(window.innerWidth >= 800)
const resize = () => { desktop.value = window.innerWidth >= 800 }
onMounted(() => window.addEventListener('resize', resize))
onBeforeUnmount(() => window.removeEventListener('resize', resize))
const aboutCopy = 'These edits were made by other users. Stay up to date and help maintain Wikipedia’s quality by reviewing them.'
const personalized = ref(localStorage.getItem('review-changes-personalization') !== 'false')
watch(personalized, value => {
  localStorage.setItem('review-changes-personalization', String(value))
})
const items = [
  { value: 'personalization', label: 'Personalization', icon: cdxIconConfigure },
  { value: 'customize', label: 'Customize preview', icon: cdxIconAppearance },
]
function choose(value: string | number | null) {
  selected.value = null
  if (value === 'customize') customize?.()
  else if (value) dialog.value = String(value)
}

</script>
<template>
  <CdxMenuButton ref="menuAnchor" v-model:selected="selected" :menu-items="items" :footer="{ value: 'about', label: 'About Review changes' }" weight="quiet" aria-label="More review changes" @update:selected="choose"><CdxIcon :icon="cdxIconEllipsis" /></CdxMenuButton>
  <CdxDialog :class="{ 'about-review-dialog': dialog === 'about' }" :open="!!dialog && desktop" :title="dialog === 'personalization' ? 'Personalization' : 'About Review changes'" :use-close-button="true" @update:open="dialog = ''">
    <template v-if="dialog === 'personalization'">
      <CdxToggleSwitch v-model="personalized" :align-switch="true">Personalization<template #description>Suggest changes from your Watchlist, pages you have edited, and related pages.</template></CdxToggleSwitch>
    </template>
    <template v-else><p>{{ aboutCopy }}</p></template>
  </CdxDialog>
  <CdxPopover class="review-changes-mobile-sheet" :open="!!dialog && !desktop" :anchor="menuAnchor" :title="dialog === 'personalization' ? 'Personalization' : 'About Review changes'" placement="bottom-end" :use-close-button="true" :use-bottom-sheet="true" @update:open="value => { if (!value) dialog = '' }">
    <CdxToggleSwitch v-if="dialog === 'personalization'" v-model="personalized" :align-switch="true">Personalization<template #description>Suggest changes from your Watchlist, pages you have edited, and related pages.</template></CdxToggleSwitch>
    <p v-else>{{ aboutCopy }}</p>
  </CdxPopover>
</template>

<style>
.about-review-dialog { width: min(640px, calc(100vw - 48px)); }
.about-review-dialog .cdx-dialog__body p { margin: 0; line-height: 1.5; }
@media (max-width: 799px) {
  html:has(.dashboard-home) { overflow-x: clip; }
  body:has(.review-changes-mobile-sheet) {
    padding-right: 0 !important;
    overflow-x: clip;
  }
  .cdx-popover__backdrop--bottom-sheet:has(.review-changes-mobile-sheet) {
    width: 100%;
    max-width: 100%;
    inset-inline: 0;
    overflow-x: clip;
  }
  .review-changes-mobile-sheet.cdx-popover {
    position: fixed !important;
    inset: auto 0 0 0 !important;
    transform: none !important;
    width: 100% !important;
    max-width: none !important;
    min-width: 0;
    margin-inline: 0 !important;
    border-radius: 0 !important;
    box-sizing: border-box;
    max-height: 90dvh;
  }
  .review-changes-mobile-sheet .cdx-popover__arrow {
    display: none !important;
  }
}
</style>
