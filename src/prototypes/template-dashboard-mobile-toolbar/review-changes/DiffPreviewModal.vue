<script setup lang="ts">
import {
  CdxAccordion,
  CdxButton,
  CdxIcon,
  CdxMessage,
  CdxProgressBar,
  CdxToast,
} from '@wikimedia/codex'
import {
  cdxIconArrowPrevious,
  cdxIconCheck,
  cdxIconHeartOutline,
  cdxIconClose,
  cdxIconCollapse,
  cdxIconEditUndo,
  cdxIconExpand,
  cdxIconInfoFilled,
  cdxIconNext,
  cdxIconPrevious,
  cdxIconUserAvatar,
} from '@wikimedia/codex-icons'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { wikimediaApiFetchHeaders } from '@/config'
import type { ReviewChange } from '../reviewChanges'
import ThankConfirmationDialog from './ThankConfirmationDialog.vue'
import UndoConfirmationDialog from './UndoConfirmationDialog.vue'
import { buildVisualDiffDocument } from './visualDiff'

const props = defineProps<{
  change: ReviewChange
  variant: 'card' | 'toolbar' | 'simplified'
  changeIndex: number
  changeCount: number
  page?: boolean
  reviewed?: boolean
}>()

const emit = defineEmits<{
  close: []
  navigate: [direction: -1 | 1]
  reviewed: [title: string, reviewed: boolean]
}>()

const editorCardOpen = ref(true)
const diffUrl = ref<string | null>(null)
const diffDocumentHtml = ref<string | null>(null)
const diffFrame = ref<HTMLIFrameElement | null>(null)
const changedSection = ref<string | null>(null)
const diffLoading = ref(false)
const diffError = ref<string | null>(null)
const undoDialogOpen = ref(false)
const thankDialogOpen = ref(false)
const confirmationToast = ref('')
const reviewedChanges = ref<Set<string>>(new Set())
let diffRequest: AbortController | null = null

watch(
  () => [props.change.title, props.reviewed] as const,
  ([title, reviewed]) => {
    const next = new Set(reviewedChanges.value)
    if (reviewed) next.add(title)
    else next.delete(title)
    reviewedChanges.value = next
  },
  { immediate: true },
)

function findFirstChangedSection(diffMarkup: string): string | null {
  const documentModel = new DOMParser().parseFromString(
    `<table><tbody>${diffMarkup}</tbody></table>`,
    'text/html',
  )
  const changedCell = documentModel.querySelector('.diff-addedline, .diff-deletedline')
  let row = changedCell?.closest('tr') ?? null

  while (row) {
    const headingMatch = row.textContent?.match(/={2,}\s*([^=]+?)\s*={2,}/)
    if (headingMatch?.[1]) {
      return headingMatch[1].trim().replaceAll(' ', '_')
    }
    row = row.previousElementSibling as HTMLTableRowElement | null
  }

  return null
}

async function loadWikipediaVisualDiff() {
  diffRequest?.abort()
  diffRequest = new AbortController()
  diffLoading.value = true
  diffError.value = null
  diffUrl.value = null
  diffDocumentHtml.value = null

  try {
    let section: string | null = null
    let comparisonMarkup = ''
    try {
      const compareEndpoint =
        `https://en.wikipedia.org/w/api.php?action=compare&format=json&origin=*` +
        `&fromrev=${props.change.oldRevisionId}&torev=${props.change.revisionId}&prop=diff`
      const compareResponse = await fetch(compareEndpoint, {
        signal: diffRequest.signal,
        headers: wikimediaApiFetchHeaders('review-changes-preview-compare'),
      })
      if (compareResponse.ok) {
        const compareData = await compareResponse.json()
        comparisonMarkup = compareData.compare?.body ?? compareData.compare?.['*'] ?? ''
        section = findFirstChangedSection(
          comparisonMarkup,
        )
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') throw error
    }
    changedSection.value = section

    if (!comparisonMarkup) throw new Error('Wikipedia returned an empty comparison')
    changedSection.value = section
    diffUrl.value = 'local-diff-document'
    diffDocumentHtml.value = await buildVisualDiffDocument(
      comparisonMarkup,
      diffRequest.signal,
      { heading: section, mobile: true },
    )
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      diffError.value = 'The Wikipedia visual diff could not be loaded.'
    }
  } finally {
    if (!diffDocumentHtml.value) diffLoading.value = false
  }
}

function onVisualDiffLoaded() {
  diffLoading.value = false
  scrollToChangedSection()
  fitCardDiffToPage()
}

function fitCardDiffToPage(attempt = 0) {
  if (!props.page || props.variant !== 'card') return

  const frame = diffFrame.value
  const frameDocument = frame?.contentDocument
  if (!frame || !frameDocument) return

  const contentHeight = Math.max(
    frameDocument.body?.scrollHeight ?? 0,
    frameDocument.documentElement?.scrollHeight ?? 0,
  )
  if (contentHeight > 0) frame.style.height = `${contentHeight}px`

  if (attempt < 6) {
    window.setTimeout(() => fitCardDiffToPage(attempt + 1), 200)
  }
}

function showUndoConfirmation(): void {
  confirmationToast.value = 'Your edit was saved.'
}

function showThankConfirmation(): void {
  confirmationToast.value = `You thanked ${props.change.editor}.`
}

function markEditReviewed(): void {
  const next = new Set(reviewedChanges.value)
  const reviewed = !next.has(props.change.title)
  if (reviewed) {
    next.add(props.change.title)
    confirmationToast.value = 'Edit marked as reviewed on your dashboard only.'
  } else {
    next.delete(props.change.title)
    confirmationToast.value = 'Edit marked as unreviewed on your dashboard only.'
  }
  reviewedChanges.value = next
  emit('reviewed', props.change.title, reviewed)
}

function clearConfirmationToast(): void {
  confirmationToast.value = ''
}

function scrollToChangedSection(attempt = 0) {
  const frameDocument = diffFrame.value?.contentDocument
  const frameWindow = diffFrame.value?.contentWindow
  const section = changedSection.value
  if (!frameDocument || !frameWindow) return

  if (!frameDocument.querySelector('#review-changes-diff-overrides')) {
    const style = frameDocument.createElement('style')
    style.id = 'review-changes-diff-overrides'
    style.textContent = `
      .header-container,
      .minerva-header,
      .mw-header,
      .mw-page-container-inner > header,
      .page-heading,
      .mw-first-heading,
      .mw-body-subheader,
      .page-actions-menu,
      .minerva__tab-container,
      .mw-revslider-container,
      .mw-diff-revision-history-links,
      .mw-diff-mobile-footer,
      .mw-diff-new-mobile-footer-accordion,
      .mw-diff-table-prefix,
      .mw-diff-inline-legend,
      .ve-init-mw-diffPage-diffMode,
      .diff-title,
      #firstHeading,
      #siteSub {
        display: none !important;
      }
    `
    frameDocument.head.append(style)
  }

  frameDocument
    .querySelectorAll('.mw-diff-mobile-footer, .mw-diff-new-mobile-footer-accordion')
    .forEach((element) => element.remove())

  const visualDiff = frameDocument.querySelector('.ve-ui-diffElement')
  if (visualDiff && visualDiff.parentElement !== frameDocument.body) {
    frameDocument.body.replaceChildren(visualDiff)
    frameDocument.body.style.margin = '0'
    frameDocument.body.style.padding = '0'
  }

  const escapedSection = section ? CSS.escape(section) : null
  const heading = escapedSection
    ? frameDocument.querySelector(`.ve-ui-diffElement #${escapedSection}`) ??
      frameDocument.querySelector(`#${escapedSection}`)
    : frameDocument.querySelector(
        '.ve-ui-diffElement h2[id], .ve-ui-diffElement h3[id], .ve-ui-diffElement h4[id]',
      )

  if (heading) {
    heading.scrollIntoView({ block: 'start' })
    return
  }

  if (attempt < 40) {
    window.setTimeout(() => scrollToChangedSection(attempt + 1), 150)
  }
}

watch(
  () => props.change,
  () => {
    void loadWikipediaVisualDiff()
  },
  { immediate: true },
)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

function userPageUrl(): string {
  return `https://en.wikipedia.org/wiki/User:${encodeURIComponent(props.change.editor)}`
}

function openUserPage() {
  window.open(userPageUrl(), '_blank', 'noopener,noreferrer')
}

async function openFullDiff(mobile = false) {
  const popup = window.open('about:blank', '_blank')
  const title = props.change.title.replaceAll(' ', '_')
  const encodedTitle = encodeURIComponent(title)
  const wikiHost = mobile ? 'en.m.wikipedia.org' : 'en.wikipedia.org'
  const fallbackUrl = `https://${wikiHost}/w/index.php?title=${encodedTitle}&action=history`

  try {
    const diffUrl =
      `https://${wikiHost}/w/index.php?title=${encodedTitle}` +
      `&diff=${props.change.revisionId}&oldid=${props.change.oldRevisionId}&diffmode=visual`
    if (popup) popup.location.href = diffUrl
  } catch {
    if (popup) popup.location.href = fallbackUrl
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  diffRequest?.abort()
})
</script>

<template>
  <div
    class="diff-preview-backdrop"
    :class="{ 'diff-preview-backdrop--page': props.page }"
    @click.self="props.page ? undefined : emit('close')"
  >
    <section
      class="diff-preview"
      :class="{
        'diff-preview--page': props.page,
        'diff-preview--card': props.variant === 'card',
        'diff-preview--toolbar': props.variant === 'toolbar',
      }"
      :role="props.page ? 'main' : 'dialog'"
      :aria-modal="props.page ? undefined : true"
      aria-labelledby="diff-preview-title"
    >
      <header class="diff-preview__header">
        <CdxButton
          v-if="props.page"
          class="diff-preview__back"
          weight="quiet"
          :icon-only="true"
        aria-label="Back to review changes"
        @click="emit('close')"
      >
          <CdxIcon :icon="cdxIconArrowPrevious" />
        </CdxButton>
        <strong id="diff-preview-title">Diff preview</strong>
        <CdxButton
          v-if="!props.page"
          class="diff-preview__close"
          weight="quiet"
          :icon-only="true"
          aria-label="Close diff preview"
          @click="emit('close')"
        >
          <CdxIcon :icon="cdxIconClose" />
        </CdxButton>
      </header>

      <div
        class="diff-preview__body"
        :class="{
          'diff-preview__body--editor-card-open': props.variant === 'card' && editorCardOpen,
        }"
      >
        <div class="diff-preview__article-heading">
          <h1>{{ props.change.title }}</h1>
          <p v-if="props.variant === 'toolbar'">
            Revision from: {{ props.change.revisionDate }} (UTC)
          </p>
          <p v-if="props.variant !== 'toolbar'">Difference between revisions</p>
        </div>

        <div v-if="props.variant !== 'toolbar'" class="diff-preview__details-row">
          <p v-if="props.variant === 'card'" class="diff-preview__revision-date">
            <strong>Revision from:</strong> {{ props.change.revisionDate }} (UTC)
          </p>
          <CdxButton
            v-else
            action="progressive"
            weight="quiet"
            @click="openFullDiff(false)"
          >
            Full diff
          </CdxButton>

          <div class="diff-preview__revision-navigation" aria-label="Revision navigation">
            <CdxButton
              :icon-only="true"
              aria-label="Previous review change"
              :disabled="props.changeIndex === 0"
              @click="emit('navigate', -1)"
            >
              <CdxIcon :icon="cdxIconPrevious" />
            </CdxButton>
            <CdxButton
              :icon-only="true"
              aria-label="Next review change"
              :disabled="props.changeIndex === props.changeCount - 1"
              @click="emit('navigate', 1)"
            >
              <CdxIcon :icon="cdxIconNext" />
            </CdxButton>
          </div>
        </div>

        <CdxAccordion
          v-if="props.variant !== 'toolbar'"
          class="edit-details-accordion"
          separation="minimal"
          heading-level="h3"
        >
          <template #title>Edit details</template>

          <div class="edit-details-accordion__content">
            <CdxButton
              v-if="props.variant !== 'card'"
              class="edit-details-accordion__username"
              action="progressive"
              weight="quiet"
              @click="openUserPage"
            >
              <CdxIcon :icon="cdxIconUserAvatar" size="small" aria-hidden="true" />
              {{ props.change.editor }}
            </CdxButton>
            <p
              v-if="props.variant !== 'card'"
              class="edit-details-accordion__revision-date"
            >
              <strong>Revision from:</strong> {{ props.change.revisionDate }} (UTC)
            </p>
            <section>
              <p class="edit-details-accordion__edit-summary">
                <strong>Edit summary:</strong> {{ props.change.summary }}
              </p>
            </section>
            <section v-if="props.change.tags?.length">
              <p><strong>Tags:</strong> {{ props.change.tags.join(', ') }}</p>
            </section>
            <CdxButton
              v-if="props.variant === 'card'"
              class="edit-details-accordion__full-diff"
              action="progressive"
              weight="quiet"
              size="small"
              @click="openFullDiff(false)"
            >
              Full diff
            </CdxButton>
          </div>
        </CdxAccordion>

        <div v-else class="diff-preview__metadata">
          <a
            class="diff-preview__username"
            :href="userPageUrl()"
            target="_blank"
            rel="noopener noreferrer"
          >
            <CdxIcon :icon="cdxIconUserAvatar" size="small" aria-hidden="true" />
            {{ props.change.editor }}
          </a>
          <CdxButton
            weight="quiet"
            size="small"
            @click="openFullDiff(true)"
          >
            Full diff
          </CdxButton>
        </div>

        <CdxProgressBar v-if="diffLoading" inline aria-label="Loading Wikipedia visual diff" />
        <CdxMessage v-else-if="diffError" type="error" :allow-user-dismiss="false">
          {{ diffError }}
        </CdxMessage>
        <div
          v-if="diffDocumentHtml"
          class="visual-diff-frame"
          :class="{ 'visual-diff-frame--loading': diffLoading }"
        >
          <iframe
            ref="diffFrame"
            class="visual-diff"
            :srcdoc="diffDocumentHtml"
            :title="`${props.change.title}: Wikipedia visual diff`"
            @load="onVisualDiffLoaded"
          />
        </div>
      </div>

      <footer
        v-if="props.variant === 'card'"
        class="diff-preview__editor-card"
        :class="{ 'diff-preview__editor-card--open': editorCardOpen }"
      >
        <button
          class="diff-preview__editor-card-toggle"
          type="button"
          :aria-expanded="editorCardOpen"
          @click="editorCardOpen = !editorCardOpen"
        >
          <span class="diff-preview__editor-card-username">
            <CdxIcon :icon="cdxIconUserAvatar" size="small" aria-hidden="true" />
            {{ props.change.editor }}
          </span>
          <CdxIcon
            :icon="editorCardOpen ? cdxIconCollapse : cdxIconExpand"
            size="small"
            aria-hidden="true"
          />
        </button>

        <div v-if="editorCardOpen" class="diff-preview__editor-card-body">
          <p class="diff-preview__user-stats">
            <span>50,000,000 edits</span>
            <span class="diff-preview__user-stats-divider" aria-hidden="true">|</span>
            <span class="diff-preview__groups">
            23 user groups
            <CdxIcon :icon="cdxIconInfoFilled" size="small" icon-label="About user groups" />
            </span>
          </p>
          <CdxButton action="progressive" @click="thankDialogOpen = true">Thank</CdxButton>
          <CdxButton @click="undoDialogOpen = true">Undo</CdxButton>
          <CdxButton @click="markEditReviewed">
            {{ reviewedChanges.has(props.change.title) ? 'Unreview' : 'Review' }}
          </CdxButton>
        </div>
      </footer>

      <footer
        v-else-if="props.variant === 'toolbar'"
        class="diff-preview__toolbar"
        aria-label="Diff review actions"
      >
        <CdxButton
          weight="quiet"
          :icon-only="true"
          aria-label="Previous change"
          :disabled="props.changeIndex === 0"
          @click="emit('navigate', -1)"
        >
          <CdxIcon :icon="cdxIconPrevious" />
        </CdxButton>
        <CdxButton
          weight="quiet"
          :icon-only="true"
          aria-label="Next change"
          :disabled="props.changeIndex === props.changeCount - 1"
          @click="emit('navigate', 1)"
        >
          <CdxIcon :icon="cdxIconNext" />
        </CdxButton>
        <CdxButton
          weight="quiet"
          :icon-only="true"
          aria-label="Thank"
          @click="thankDialogOpen = true"
        >
          <CdxIcon :icon="cdxIconHeartOutline" />
        </CdxButton>
        <CdxButton
          weight="quiet"
          :icon-only="true"
          aria-label="Revert change"
          @click="undoDialogOpen = true"
        >
          <CdxIcon :icon="cdxIconEditUndo" />
        </CdxButton>
        <CdxButton
          weight="quiet"
          :icon-only="true"
          aria-label="Mark edit as reviewed"
          :class="{ 'diff-preview__reviewed-action--complete': reviewedChanges.has(props.change.title) }"
          @click="markEditReviewed"
        >
          <CdxIcon :icon="cdxIconCheck" />
        </CdxButton>
      </footer>
    </section>
    <UndoConfirmationDialog
      v-model:open="undoDialogOpen"
      @confirmed="showUndoConfirmation"
    />
    <ThankConfirmationDialog
      v-model:open="thankDialogOpen"
      @confirmed="showThankConfirmation"
    />
    <CdxToast
      v-if="confirmationToast"
      standalone
      class="mobile-prototype-toast"
      type="success"
      :prevent-user-dismiss="false"
      :auto-dismiss="true"
      @auto-dismissed="clearConfirmationToast"
      @user-dismissed="clearConfirmationToast"
    >
      {{ confirmationToast }}
    </CdxToast>
  </div>
</template>

<style scoped>
:global(.mobile-prototype-toast .cdx-message__dismiss-button) {
  display: none;
}

:global(.mobile-prototype-toast .cdx-message--user-dismissable) {
  padding-right: var(--spacing-75, 12px);
}

.diff-preview-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: center;
  background: var(--background-color-backdrop-light, rgba(0, 0, 0, 0.35));
}

.diff-preview {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: min(100%, 480px);
  height: 100%;
  background: var(--background-color-base);
  box-shadow: var(--box-shadow-drop-medium);
}

.diff-preview__header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 46px;
  padding-inline: var(--spacing-100, 16px);
  border-bottom: var(--border-subtle);
}

.diff-preview__close {
  position: absolute;
  inset-inline-end: var(--spacing-50, 8px);
}

.diff-preview__back {
  position: absolute;
  inset-inline-start: var(--spacing-50, 8px);
}

.diff-preview-backdrop--page {
  position: static;
  min-height: 100vh;
  background: var(--background-color-base);
}

.diff-preview--page {
  width: 100%;
  max-width: none;
  min-height: 100vh;
  box-shadow: none;
}

.diff-preview__body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: var(--spacing-100, 16px);
  overflow: hidden;
}

.diff-preview__article-heading {
  padding-bottom: var(--spacing-100, 16px);
  border-bottom: var(--border-subtle);
}

.diff-preview__article-heading h1 {
  margin: 0;
  font-family: var(--font-family-serif);
  font-size: var(--font-size-xx-large);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-xx-large);
}

.diff-preview__article-heading p {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  line-height: var(--line-height-small);
}

.diff-preview__details-row,
.diff-preview__metadata {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-100, 16px);
  min-height: 52px;
  padding-block-start: var(--spacing-75, 12px);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
}

.diff-preview__revision-date {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-small);
}

.diff-preview--toolbar .diff-preview__metadata {
  box-sizing: border-box;
  flex: 0 0 46px;
  height: 46px;
  min-height: 0;
  padding-block: 0;
  line-height: 1;
}

.diff-preview--toolbar .diff-preview__metadata > * {
  align-self: center;
}

.diff-preview--toolbar .visual-diff-frame {
  margin-top: 0;
}

.diff-preview--toolbar .diff-preview__body {
  padding-bottom: 0;
}

.edit-details-accordion__revision-date {
  margin: 0;
  font-family: var(--font-family-base);
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-medium);
}

.edit-details-accordion {
  flex: 0 0 auto;
  width: 100%;
  margin-bottom: 0;
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-normal);
}

.edit-details-accordion :deep(summary) {
  color: var(--color-progressive);
  font-family: var(--font-family-base);
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-medium);
}

.edit-details-accordion__content {
  position: relative;
  z-index: 1;
  padding: 0 var(--spacing-75, 12px) var(--spacing-100, 16px);
  background: var(--background-color-base);
}

.edit-details-accordion__content section + section {
  margin-top: var(--spacing-100, 16px);
}

.diff-preview--card .edit-details-accordion__content section + section {
  margin-top: var(--spacing-50, 8px);
}

.edit-details-accordion__username + section {
  margin-top: var(--spacing-100, 16px);
}

.edit-details-accordion__username + .edit-details-accordion__revision-date {
  margin-top: var(--spacing-25, 4px);
}

.edit-details-accordion__revision-date + section {
  margin-top: var(--spacing-50, 8px);
}

.edit-details-accordion__content section {
  display: grid;
  gap: var(--spacing-25, 4px);
}

.edit-details-accordion__content h3,
.edit-details-accordion__content p,
.edit-details-accordion__content ul {
  margin: 0;
}

.edit-details-accordion__content h3 {
  margin-bottom: 0;
  font-family: var(--font-family-base);
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-medium);
}

.edit-details-accordion__content section p {
  font-family: var(--font-family-base);
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-medium);
}

.edit-details-accordion__edit-summary {
  color: var(--color-base, #202122);
}

.edit-details-accordion__content ul {
  padding-inline-start: var(--spacing-100, 16px);
}

.edit-details-accordion__username {
  justify-content: flex-start;
  margin-top: var(--spacing-25, 4px);
  padding-inline: 0;
  font-family: var(--font-family-base);
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-medium);
}

.edit-details-accordion__full-diff {
  justify-content: flex-start;
  margin-top: var(--spacing-25, 4px);
  padding-inline: 0;
  font-weight: var(--font-weight-bold);
}

.diff-preview__revision-navigation {
  display: flex;
  align-items: center;
  gap: var(--spacing-75, 12px);
}

.diff-preview__metadata span,
.diff-preview__metadata a {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-25, 4px);
}

.diff-preview__username {
  font-family: var(--font-family-base);
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-medium);
}

.visual-diff-frame {
  flex: 1 1 auto;
  width: 100%;
  min-height: 240px;
  margin-top: 10px;
  overflow: hidden;
  background: var(--background-color-base);
}

.edit-details-accordion[open] ~ .visual-diff-frame {
  margin-top: 0;
}

.visual-diff {
  display: block;
  width: 100%;
  height: 100%;
  margin: 0;
  background: var(--background-color-base);
  border: 0;
}

.visual-diff-frame--loading {
  visibility: hidden;
}

.diff-preview__toolbar {
  display: flex;
  align-items: center;
  min-height: 52px;
  padding-inline: var(--spacing-100, 16px);
  background: var(--background-color-base);
  border-top: var(--border-subtle);
}

.diff-preview__editor-card {
  background: var(--background-color-base);
  border-top: var(--border-subtle);
}

.diff-preview__editor-card--open {
  margin: 0;
  border-inline: 0;
  border-bottom: 0;
  box-shadow: none;
}

.diff-preview__editor-card-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 52px;
  margin: 0;
  padding: 0 var(--spacing-100, 16px);
  color: var(--color-progressive);
  background: var(--background-color-base);
  border: 0;
  font: inherit;
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  gap: var(--spacing-50, 8px);
}

.diff-preview__editor-card-toggle:focus-visible {
  outline: 2px solid var(--border-color-progressive--focus);
  outline-offset: -2px;
}

.diff-preview__editor-card-toggle > .cdx-icon:not(:last-child) {
  display: none;
}

.diff-preview__reviewed-action--complete.cdx-button:enabled,
.diff-preview__reviewed-action--complete.cdx-button:enabled .cdx-icon {
  color: var(--color-icon-success, #099979);
}

.diff-preview__editor-card-username {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-25, 4px);
}

.diff-preview__editor-card-body {
  display: grid;
  gap: var(--spacing-75, 12px);
  padding: 0 var(--spacing-100, 16px) var(--spacing-100, 16px);
}

.diff-preview__editor-card-body p {
  margin: 0;
  color: var(--color-subtle);
}

.diff-preview__user-stats,
.diff-preview__groups {
  display: flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
}

.diff-preview__user-stats {
  flex-wrap: wrap;
}

.diff-preview__user-stats-divider {
  color: var(--color-subtle);
}

.diff-preview__editor-card-body .cdx-button {
  width: 100%;
  max-width: none;
}

.diff-preview__toolbar {
  justify-content: space-between;
}

@media (max-width: 639px) {
  .diff-preview--page .diff-preview__header {
    position: sticky;
    z-index: 3;
    top: 0;
    background: var(--background-color-base);
  }

  .diff-preview--page.diff-preview--card {
    height: auto;
    min-height: 100vh;
    min-height: 100dvh;
    overflow: visible;
  }

  .diff-preview--page.diff-preview--card .diff-preview__body {
    overflow: visible;
    padding-bottom: calc(var(--spacing-100, 16px) + 52px);
  }

  .diff-preview--page.diff-preview--card .diff-preview__body--editor-card-open {
    padding-bottom: calc(var(--spacing-100, 16px) + 224px);
  }

  .diff-preview--page.diff-preview--card .visual-diff-frame {
    flex: 0 0 auto;
    min-height: 0;
    overflow: visible;
  }

  .diff-preview--page.diff-preview--card .diff-preview__editor-card {
    position: fixed;
    z-index: 2;
    inset-inline-start: 0;
    bottom: 0;
    width: 100%;
    max-width: none;
    transform: none;
  }
}

@media (min-width: 640px) {
  .diff-preview-backdrop {
    align-items: center;
    padding: var(--spacing-200, 32px);
  }

  .diff-preview {
    height: min(760px, calc(100vh - 64px));
    border-radius: var(--border-radius-base, 2px);
    overflow: hidden;
  }

  .diff-preview-backdrop--page {
    align-items: stretch;
    padding: 0;
  }

  .diff-preview--page {
    height: 100vh;
    border-radius: 0;
  }
}
</style>
