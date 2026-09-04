<script setup lang="ts">
import {
  CdxButton,
  CdxCard,
  CdxDialog,
  CdxIcon,
  CdxInfoChip,
  CdxPopover,
  CdxToggleSwitch,
} from '@wikimedia/codex'
import {
  cdxIconBell,
  cdxIconConfigure,
  cdxIconPictureInPicture,
  cdxIconPrevious,
  cdxIconSearch,
  cdxIconUserAvatar,
  cdxIconVerticalEllipsis,
} from '@wikimedia/codex-icons'
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

definePage({
  meta: {
    title: 'Review changes personalization',
    description: 'Mobile review queue with controls that explain or turn off personalized changes.',
  },
})

interface ReviewSuggestion {
  title: string
  description: string
  editor: string
  time: string
  summary: string
  reason: string
  source?: 'watchlist' | 'edited' | 'related'
  featured?: boolean
}

const personalizedChanges: ReviewSuggestion[] = [
  {
    title: 'Cactus, Texas',
    description: 'City in Texas, United States',
    editor: 'Brandon432',
    time: '10 hours ago',
    summary: '',
    reason: '',
    source: 'watchlist',
  },
  {
    title: 'List of National Sports Award recipients in Olympic sports',
    description: 'Rukyjanun language spoken in Japan',
    editor: 'OlympicSportsFan',
    time: '20 minutes ago',
    summary: 'restoring names that were changed by a vandal then removed',
    reason: 'Major changes',
    source: 'related',
  },
  {
    title: 'Southern Amami Ōshima language',
    description: 'Rukyuan language spoken in Japan',
    editor: 'Plantsupport',
    time: '2 minutes ago',
    summary: 'ridership update',
    reason: 'High activity',
    source: 'edited',
  },
  {
    title: 'Mesrop Mashtots Monastery',
    description: 'Armenian monastery in Nasirvaz, Nakhichevan',
    editor: 'AdamHamiltonS',
    time: '10 minutes ago',
    summary:
      'Added internal links to Goghtn and Mesrop Mashtots to help readers find relevant background',
    reason: '',
    source: 'watchlist',
  },
  {
    title: 'Enthnologue',
    description: "Catalogue of the world's languages",
    editor: 'Brandonthereader',
    time: '2 minutes ago',
    summary: 'History: HTTP to HTTPS for Wayback Machine, replaced: http://web.archive.org/…',
    reason: '',
    source: 'related',
  },
]

const recentChanges: ReviewSuggestion[] = [
  {
    title: 'Cactus',
    description: 'Family of mostly succulent plants, adapted to dry environments',
    editor: 'AdamHamiltonS',
    time: '10 hours ago',
    summary: '',
    reason: 'High revert risk',
  },
  {
    title: 'Deep-sea gigantism',
    description: 'Tendency for deep-sea animals to grow unusually large',
    editor: 'OceanEditor',
    time: '4 minutes ago',
    summary: 'Updated examples and added a recent scientific reference',
    reason: 'Major changes',
  },
  {
    title: 'Ethnologue',
    description: "Catalogue of the world's languages",
    editor: 'Brandonthereader',
    time: '2 minutes ago',
    summary: 'History: HTTP to HTTPS for Wayback Machine, replaced: http://web.archive.org/…',
    reason: '',
  },
]

const settingsButton = ref<InstanceType<typeof CdxButton> | null>(null)
const settingsOpen = ref(false)
const isDesktopMode = ref(false)
const useDialogConfiguration = ref(false)
const configurationDialogOpen = ref(false)
const personalizationEnabled = ref(true)
const useWatchlist = ref(true)
const useEditedPages = ref(true)
const useRelatedPages = ref(true)
const appliedUseWatchlist = ref(true)
const appliedUseEditedPages = ref(true)
const appliedUseRelatedPages = ref(true)
const appliedPersonalization = ref(true)
const filteredPersonalizedChanges = computed(() =>
  personalizedChanges.filter((change) => {
    if (change.source === 'watchlist') return appliedUseWatchlist.value
    if (change.source === 'edited') return appliedUseEditedPages.value
    if (change.source === 'related') return appliedUseRelatedPages.value
    return true
  }),
)
const visibleChanges = computed(() => {
  if (!appliedPersonalization.value) return recentChanges
  return filteredPersonalizedChanges.value.length
    ? filteredPersonalizedChanges.value
    : recentChanges
})
const desktopChanges = computed(() => {
  const changes = visibleChanges.value
  return changes.length > 2 ? [changes[2], changes[0], changes[1], ...changes.slice(3)] : changes
})

watch(settingsOpen, (isOpen, wasOpen) => {
  if (wasOpen && !isOpen) {
    appliedPersonalization.value = personalizationEnabled.value
  }
})
const mobileViewIcon =
  '<path fill-rule="evenodd" d="M6 1h8a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V3a2 2 0 012-2zm0 2v12h8V3H6zm3 13h2v1H9v-1z"/>'

function openConfiguration() {
  if (useDialogConfiguration.value) {
    configurationDialogOpen.value = true
  } else {
    settingsOpen.value = !settingsOpen.value
  }
}

function savePersonalizationSources() {
  appliedUseWatchlist.value = useWatchlist.value
  appliedUseEditedPages.value = useEditedPages.value
  appliedUseRelatedPages.value = useRelatedPages.value
  configurationDialogOpen.value = false
}
</script>

<template>
  <div class="prototype-stage">
    <main
      class="personalization-prototype"
      :class="{ 'personalization-prototype--desktop': isDesktopMode }"
    >
      <header v-if="!isDesktopMode" class="page-header">
        <RouterLink to="/" class="icon-button" aria-label="Back to prototypes">
          <CdxIcon :icon="cdxIconPrevious" />
        </RouterLink>
        <h1>
          <button
            class="version-title-button"
            type="button"
            @click="useDialogConfiguration = !useDialogConfiguration"
          >
            Review changes
          </button>
        </h1>
        <div class="header-actions">
          <CdxButton
            class="desktop-button"
            weight="quiet"
            aria-label="Toggle desktop view"
            :aria-pressed="isDesktopMode"
            @click="isDesktopMode = !isDesktopMode"
          >
            <CdxIcon :icon="cdxIconPictureInPicture" />
          </CdxButton>
          <CdxButton
            ref="settingsButton"
            class="settings-button"
            weight="quiet"
            aria-label="Review changes settings"
            :aria-expanded="settingsOpen"
            @click="openConfiguration"
          >
            <CdxIcon :icon="cdxIconConfigure" />
          </CdxButton>
        </div>
      </header>
      <template v-else>
        <header class="desktop-site-header">
          <div class="desktop-wordmark">
            <strong>WIKIPEDIA</strong>
            <small>25 years of the free encyclopedia</small>
          </div>
          <div class="desktop-search">
            <CdxIcon :icon="cdxIconSearch" />
            <span>Search Wikipedia</span>
            <strong>Search</strong>
          </div>
          <div class="desktop-account-actions">
            <a href="#">OTichonova (WMF)</a>
            <CdxIcon :icon="cdxIconBell" />
            <CdxIcon :icon="cdxIconUserAvatar" />
          </div>
        </header>
        <div class="desktop-content-header">
          <div class="desktop-greeting">
            <h1>Hello, OTichonova (WMF)!</h1>
            <span><a href="#">Share feedback</a> <em>⚗ Beta</em></span>
          </div>
          <div class="desktop-overflow"><CdxIcon :icon="cdxIconVerticalEllipsis" /></div>
          <div
            class="desktop-review-header"
            :class="{ 'desktop-review-header--popover-open': settingsOpen }"
          >
            <CdxButton
              class="desktop-return-button"
              weight="quiet"
              aria-label="Return to mobile view"
              @click="isDesktopMode = false"
            >
              <CdxIcon :icon="cdxIconPrevious" />
            </CdxButton>
            <button
              class="version-title-button version-title-button--desktop"
              type="button"
              @click="useDialogConfiguration = !useDialogConfiguration"
            >
              Review changes
            </button>
            <div class="desktop-review-actions">
              <CdxButton
                class="desktop-mode-button"
                weight="quiet"
                aria-label="Switch to mobile view"
                @click="isDesktopMode = false"
              >
                <CdxIcon :icon="mobileViewIcon" />
              </CdxButton>
              <CdxButton
                ref="settingsButton"
                class="desktop-settings-button"
                weight="quiet"
                aria-label="Review changes settings"
                :aria-expanded="settingsOpen"
                @click="openConfiguration"
              >
                <CdxIcon :icon="cdxIconConfigure" />
              </CdxButton>
            </div>
          </div>
        </div>
      </template>
      <CdxPopover
        v-model:open="settingsOpen"
        class="settings-popover"
        :class="isDesktopMode ? 'settings-popover--desktop' : 'settings-popover--mobile'"
        :anchor="settingsButton"
        title="Configure Review Changes"
        placement="bottom-end"
        :use-close-button="true"
        :use-bottom-sheet="!isDesktopMode"
        :render-in-place="true"
        close-button-label="Close settings"
      >
        <CdxToggleSwitch v-model="personalizationEnabled" :align-switch="true">
          Personalization
          <template #description>
            Suggests changes from your Watchlist, edited pages, and related pages.
          </template>
        </CdxToggleSwitch>
        <p class="settings-popover__learn-more">
          Learn more about the
          <a
            href="https://www.mediawiki.org/wiki/Special:MyLanguage/Growth"
            target="_blank"
            rel="noreferrer"
            >recommender system</a
          >
        </p>
      </CdxPopover>

      <CdxDialog
        v-model:open="configurationDialogOpen"
        class="personalization-dialog"
        :class="isDesktopMode ? 'personalization-dialog--desktop' : 'personalization-dialog--mobile'"
        title="Personalize the changes"
        :use-close-button="true"
        :render-in-place="true"
        close-button-label="Close personalization settings"
      >
        <p class="personalization-dialog__description">
          Select which information is used to personalize your changes.
        </p>
        <div class="personalization-dialog__options">
          <CdxToggleSwitch v-model="useWatchlist" :align-switch="true">
            Pages on your Watchlist.
          </CdxToggleSwitch>
          <CdxToggleSwitch v-model="useEditedPages" :align-switch="true">
            Pages you have edited.
          </CdxToggleSwitch>
          <CdxToggleSwitch v-model="useRelatedPages" :align-switch="true">
            Pages related to those you have edited.
          </CdxToggleSwitch>
        </div>
        <CdxButton
          class="personalization-dialog__done"
          action="progressive"
          weight="primary"
          @click="savePersonalizationSources"
        >
          Save
        </CdxButton>
      </CdxDialog>

      <section class="review-list" aria-label="Suggested changes to review">
        <CdxCard
          v-for="change in isDesktopMode ? desktopChanges : visibleChanges"
          :key="change.title"
          class="review-card"
        >
          <template #title>
            <CdxInfoChip
              v-if="change.reason"
              class="review-card__reason"
              :status="change.reason === 'High revert risk' ? 'warning' : 'notice'"
            >
              {{ change.reason }}
            </CdxInfoChip>
            <span class="review-card__title">{{ change.title }}</span>
          </template>
          <template #description>
            <span class="review-card__description">{{ change.description }}</span>
          </template>
          <template #supporting-text>
            <span v-if="change.summary" class="review-card__summary">{{ change.summary }}</span>
            <span class="review-card__editor">
              <CdxIcon :icon="cdxIconUserAvatar" size="small" aria-hidden="true" />
              <span>{{ change.editor }} · {{ change.time }}</span>
            </span>
          </template>
        </CdxCard>
      </section>
    </main>
  </div>
</template>

<style scoped>
.prototype-stage {
  min-height: 100vh;
  background: #eaecf0;
}

.personalization-prototype {
  position: relative;
  box-sizing: border-box;
  width: 360px;
  max-width: 360px;
  height: 640px;
  min-height: 0;
  margin: 0;
  margin-inline-start: max(0px, calc(50vw - 180px));
  overflow-y: auto;
  scrollbar-width: none;
  color: var(--color-base, #202122);
  background: var(--background-color-base, #fff);
  font-family: var(--font-family-base, sans-serif);
}

.personalization-prototype::-webkit-scrollbar {
  display: none;
}

.personalization-prototype--desktop {
  width: 100vw;
  min-width: 0;
  max-width: none;
  height: max(800px, 100vh);
  margin: 0;
}

.personalization-prototype--desktop .review-list {
  width: min(880px, calc(100% - 48px));
  margin: 0 auto;
  padding: 16px;
}

.personalization-prototype--desktop .review-card__description,
.personalization-prototype--desktop .review-card__editor span {
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
}

.desktop-site-header {
  display: grid;
  grid-template-columns: 160px minmax(280px, 475px) 1fr;
  align-items: start;
  gap: 20px;
  min-height: 64px;
  padding: 12px 44px;
}

.desktop-wordmark { display: flex; flex-direction: column; font-family: Georgia, serif; }
.desktop-wordmark strong { font-size: 23px; font-weight: 400; line-height: 24px; }
.desktop-wordmark small { font-size: 9px; }

.desktop-search {
  display: grid;
  grid-template-columns: 34px 1fr 70px;
  align-items: center;
  height: 30px;
  border: 1px solid var(--border-color-interactive, #72777d);
  color: var(--color-subtle, #54595d);
}
.desktop-search .cdx-icon { justify-self: center; }
.desktop-search strong {
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1px solid var(--border-color-interactive, #72777d);
  color: var(--color-base, #202122);
  background: var(--background-color-interactive-subtle, #f8f9fa);
}

.desktop-account-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  height: 32px;
}
.desktop-account-actions a,
.desktop-greeting a { color: var(--color-progressive, #36c); text-decoration: none; }

.desktop-content-header {
  width: min(896px, calc(100% - 48px));
  margin: 0 auto;
  padding-top: 12px;
}
.desktop-greeting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid var(--border-color-subtle, #c8ccd1);
}
.desktop-greeting h1 {
  margin: 0;
  font-family: Georgia, serif;
  font-size: 30px;
  font-weight: 400;
  line-height: 48px;
}
.desktop-greeting em {
  border: 1px solid var(--border-color-interactive, #72777d);
  border-radius: 9999px;
  padding: 1px 6px;
  color: var(--color-base, #202122);
  font-style: normal;
}
.desktop-overflow {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 44px;
  border-bottom: 1px solid var(--border-color-subtle, #c8ccd1);
}
.desktop-review-header {
  display: grid;
  grid-template-columns: 32px 1fr 64px;
  align-items: center;
  height: 44px;
  border-bottom: 1px solid var(--border-color-subtle, #c8ccd1);
}
.desktop-review-header--popover-open { border-bottom-color: transparent; }
.desktop-return-button,
.desktop-settings-button,
.desktop-mode-button { min-width: 20px; width: 20px; padding: 0; }
.desktop-review-actions {
  display: flex;
  gap: var(--spacing-50, 8px);
  justify-self: end;
  padding-inline-end: var(--spacing-100, 16px);
}

.personalization-prototype
  :deep(.cdx-popover__backdrop:has(.settings-popover--mobile)) {
  position: absolute;
  inset: 0;
  z-index: 400;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 360px !important;
  height: 100%;
  min-height: 0;
  background: var(--background-color-backdrop-light, rgba(255, 255, 255, 0.65));
}

.personalization-prototype :deep(.settings-popover--mobile) {
  position: absolute !important;
  top: auto !important;
  right: auto !important;
  bottom: 0 !important;
  left: -1px !important;
  z-index: 1;
  height: auto !important;
  box-sizing: border-box;
  width: 360px !important;
  min-width: 0;
  max-width: none !important;
  max-height: 90%;
  border-right: 0;
  border-bottom: 0;
  border-left: 0;
  border-radius: 0;
  padding: 0;
  transform: none !important;
}

.personalization-prototype :deep(.settings-popover--mobile .cdx-popover__arrow) {
  display: none;
}

.personalization-prototype :deep(.settings-popover--desktop .cdx-popover__arrow) {
  top: -8px !important;
  z-index: 1;
}

.personalization-prototype :deep(.settings-popover--desktop .cdx-popover__header) {
  margin-bottom: var(--spacing-100, 16px);
}

.personalization-prototype :deep(.settings-popover--mobile .cdx-popover__header) {
  margin: 0;
  padding: var(--spacing-100, 16px);
}

.personalization-prototype :deep(.settings-popover--mobile .cdx-popover__body) {
  padding: var(--spacing-50, 8px) var(--spacing-100, 16px) var(--spacing-150, 24px);
}

.personalization-prototype :deep(.settings-popover .cdx-toggle-switch--align-switch) {
  align-items: flex-start;
}

.page-header {
  position: sticky;
  z-index: 10;
  top: 0;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 64px;
  align-items: center;
  height: 46px;
  padding: 0;
  border-bottom: 1px solid var(--border-color-subtle, #c8ccd1);
  background: var(--background-color-base, #fff);
}

.page-header h1 {
  position: absolute;
  left: 50%;
  margin: 0;
  color: var(--color-base, #202122);
  font-family: var(--font-family-base, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  font-size: var(--font-size-medium, 16px);
  font-weight: var(--font-weight-bold, 700);
  line-height: var(--line-height-medium, 22px);
  letter-spacing: normal;
  text-align: center;
  transform: translateX(-50%);
}

.version-title-button {
  margin: 0;
  border: 0;
  padding: 0;
  color: inherit;
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.version-title-button--desktop {
  justify-self: start;
  font-weight: var(--font-weight-bold, 700);
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  color: var(--color-base, #202122);
  background: transparent;
  cursor: pointer;
}

.header-actions {
  display: flex;
  grid-column: 3;
  gap: var(--spacing-50, 8px);
  justify-self: end;
  margin-inline-end: var(--spacing-100, 16px);
}

.desktop-button,
.settings-button {
  position: relative;
  width: 20px;
  min-width: 20px;
  height: 44px;
  min-height: 44px;
  margin-inline-start: auto;
  padding: 0;
  justify-self: end;
}

.settings-popover__learn-more {
  margin: var(--spacing-100, 16px) 0 0;
  font-size: var(--font-size-medium, 16px);
  line-height: var(--line-height-small, 22px);
}

.settings-popover__learn-more a {
  color: var(--color-progressive, #36c);
}

.personalization-prototype :deep(.cdx-dialog-backdrop) {
  position: absolute;
  inset: 0;
  z-index: 800;
  width: 100%;
  height: 100%;
}

.personalization-prototype:not(.personalization-prototype--desktop)
  :deep(.personalization-dialog) {
  width: calc(100% - 32px);
  max-width: calc(100% - 32px);
}

.personalization-prototype--desktop :deep(.personalization-dialog--desktop) {
  width: calc(100vw - 32px);
  max-width: 32rem;
  height: auto;
  max-height: calc(100% - 32px);
}

.personalization-prototype :deep(.personalization-dialog .cdx-dialog__header__title) {
  font-size: 20px;
  font-weight: var(--font-weight-bold, 700);
  line-height: 26px;
}

.personalization-prototype :deep(.personalization-dialog .cdx-dialog__body) {
  font-size: var(--font-size-medium, 16px);
  line-height: var(--line-height-small, 22px);
}

.personalization-dialog__description {
  margin: 0 0 var(--spacing-100, 16px);
  color: var(--color-subtle, #54595d);
  font-size: var(--font-size-medium, 16px);
  font-weight: var(--font-weight-normal, 400);
  line-height: var(--line-height-small, 22px);
}

.personalization-dialog__options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100, 16px);
  margin-bottom: var(--spacing-150, 24px);
}

.personalization-dialog__options :deep(.cdx-toggle-switch) {
  align-items: flex-start;
  margin: 0;
  font-size: var(--font-size-medium, 16px);
  font-weight: var(--font-weight-normal, 400);
  line-height: var(--line-height-small, 22px);
}

.personalization-dialog__done {
  width: 100%;
  max-width: none;
  font-size: var(--font-size-medium, 16px);
  font-weight: var(--font-weight-bold, 700);
  line-height: var(--line-height-small, 22px);
}

.personalization-prototype--desktop .personalization-dialog__done {
  display: block;
  width: auto;
  min-width: 0;
  max-width: var(--max-width-button-base, 28rem);
  margin-inline-start: auto;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50, 8px);
  padding: 16px;
}

.review-card {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--border-color-subtle, #c8ccd1);
  background: var(--background-color-base, #fff);
}

.review-card :deep(.cdx-card__text) {
  min-width: 0;
  width: 100%;
}

.review-card__title {
  display: block;
  margin: 3px 0 0;
}
.review-card__description {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.review-card__editor {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 0;
}
.review-card__editor span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.review-card__summary {
  display: block;
  margin-bottom: var(--spacing-25, 4px);
}

.review-card__reason {
  margin-bottom: 2px;
}

.review-card__reason :deep(.cdx-info-chip__text) {
  font-weight: var(--font-weight-normal, 400);
}

@media (min-width: 600px) {
  .personalization-prototype {
    border-right: 1px solid #c8ccd1;
    border-left: 1px solid #c8ccd1;
  }
}
</style>
