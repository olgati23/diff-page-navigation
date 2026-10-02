<script setup lang="ts">
import {
  CdxAccordion,
  CdxButton,
  CdxPopover,
  CdxRadio,
  CdxIcon,
  CdxMessage,
  CdxProgressBar,
  CdxToast,
} from '@wikimedia/codex'
import {
  cdxIconStar,
  cdxIconUnStar,
  cdxIconHalfStar,
  cdxIconArrowPrevious,
  cdxIconSuccess,
  cdxIconUserTalk,
  cdxIconClose,
  cdxIconCollapse,
  cdxIconExpand,
  cdxIconInfoFilled,
  cdxIconNext,
  cdxIconPrevious,
  cdxIconUserAvatar,
} from '@wikimedia/codex-icons'
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

import { wikimediaApiFetchHeaders } from '@/config'
import { RouterLink } from 'vue-router'
import { localeQuery } from '../../prototypeLocale'
import type { ReviewChange } from '../reviewChanges'
import ThankConfirmationDialog from './ThankConfirmationDialog.vue'
import UndoConfirmationDialog from './UndoConfirmationDialog.vue'
import { buildVisualDiffDocument } from './visualDiff'

const toolbarReviewIcon = '<circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="m14.806 7.249-4.906 5.956H8.801L6 11.105l1.2-1.6 2.024 1.518L13.244 6z"/>'
const filledUndoIcon = '<path d="m11.76 12.463-5.213 5.216a1 1 0 0 1-.394.242L1.91 19.335.64 18.076l1.413-4.243a1 1 0 0 1 .242-.39l5.222-5.222z"/><path d="m14.124 1.5-3 3H14a6 6 0 0 1 6 6V14h-2v-3.5a4 4 0 0 0-4-4h-2.876l3 3-1.414 1.414-4.707-4.707V4.793L12.71.086z"/>'

const props = defineProps<{
  mobileVersion?: 'A' | 'B'
  complete?: boolean
  change: ReviewChange
  variant: 'card' | 'toolbar' | 'simplified'
  changeIndex: number
  changeCount: number
  page?: boolean
  reviewed?: boolean
  undone?: boolean
}>()

const emit = defineEmits<{
  close: []
  navigate: [direction: -1 | 1]
  reviewed: [title: string, reviewed: boolean]
  undone: [title: string]
  restored: [title: string]
}>()

const completionIllustration = `${import.meta.env.BASE_URL}images/review-complete.svg`
const headerWatchAnchor = ref(null)
const watchOpen = ref(false)
const watchPeriods = reactive<Record<string, string>>({})
const watchOptions = [
  { value: 'infinite', label: 'Permanent' },
  ...['1 week', '1 month', '3 months', '6 months', '1 year'].map(value => ({ value, label: value })),
]
function toggleWatch() {
  if (watchPeriods[props.change.title]) delete watchPeriods[props.change.title]
  else watchPeriods[props.change.title] = 'infinite'
  watchOpen.value = true
}
watch(() => props.change.title, () => { watchOpen.value = false })
function fullDifferenceUrl() {
  return `${import.meta.env.BASE_URL}template-full-diff-readonly?title=${encodeURIComponent(props.change.title)}${localeQuery()}`
}
const editorCardOpen = ref(true)
const diffUrl = ref<string | null>(null)
const diffDocumentHtml = ref<string | null>(null)
const diffFrame = ref<HTMLIFrameElement | null>(null)
const changedSection = ref<string | null>(null)
const diffLoading = ref(false)
const diffError = ref<string | null>(null)
const undoDialogOpen = ref(false)
const thankDialogOpen = ref(false)
const thanksConfirmedKey = 'mobile-watch-thanks-confirmed'
const hasConfirmedThanks = ref(false)
try {
  hasConfirmedThanks.value = sessionStorage.getItem(thanksConfirmedKey) === 'true'
} catch { /* Keep the preference in memory when browser storage is unavailable. */ }
const confirmationToast = ref('')
const confirmationToastType = ref<'success' | 'notice'>('success')
const reviewedChanges = ref<Set<string>>(new Set())
const thankedChanges = ref<Set<string>>(new Set())
let diffRequest: AbortController | null = null
let toolbarDiffObserver: ResizeObserver | undefined

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
        `https://${props.change.wikiHost ?? 'en.wikipedia.org'}/w/api.php?action=compare&format=json&origin=*` +
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
      { heading: section, mobile: true, wikiHost: props.change.wikiHost },
    )
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      diffError.value = 'The Wikipedia visual diff could not be loaded.'
    }
  } finally {
    if (!diffDocumentHtml.value) diffLoading.value = false
  }
}

function fitToolbarDiff() {
  if (props.variant !== 'toolbar') return
  const frame = diffFrame.value
  const doc = frame?.contentDocument
  if (!frame || !doc?.body) return
  const style = doc.createElement('style')
  style.textContent = 'html, body { height: auto !important; min-height: 0 !important; overflow-y: hidden !important; } * { scrollbar-width: thin; scrollbar-color: #c8ccd1 transparent; } ::-webkit-scrollbar { width: 4px; height: 4px; } ::-webkit-scrollbar-thumb { background: #c8ccd1; border-radius: 4px; }'
  doc.head.append(style)
  const resize = () => { frame.style.height = `${Math.ceil(doc.body.getBoundingClientRect().height + Math.max(0, doc.body.scrollHeight - doc.body.clientHeight)) + 2}px` }
  toolbarDiffObserver?.disconnect()
  toolbarDiffObserver = new ResizeObserver(resize)
  toolbarDiffObserver.observe(doc.body)
  resize()
}
onBeforeUnmount(() => toolbarDiffObserver?.disconnect())
function onVisualDiffLoaded() {
  diffLoading.value = false
  if (props.variant !== 'toolbar') scrollToChangedSection()
  fitToolbarDiff()
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
  confirmationToastType.value = 'success'
  confirmationToast.value = 'Your edit was saved.'
  emit('undone', props.change.title)
}

function requestUndo(): void {
  if (props.undone) {
    confirmationToastType.value = 'notice'
    confirmationToast.value = 'This edit has already been undone'
    return
  }
  undoDialogOpen.value = true
}

function showThankConfirmation(): void {
  hasConfirmedThanks.value = true
  try {
    sessionStorage.setItem(thanksConfirmedKey, 'true')
  } catch { /* The in-memory preference still applies for this preview. */ }
  const next = new Set(thankedChanges.value)
  next.add(props.change.title)
  thankedChanges.value = next
  confirmationToastType.value = 'success'
  confirmationToast.value = `You thanked ${props.change.editor}.`
}

function requestThanks(): void {
  if (thankedChanges.value.has(props.change.title)) {
    confirmationToastType.value = 'notice'
    confirmationToast.value = props.mobileVersion !== 'B' ? `You already thanked ${props.change.editor}` : "A ‘Thanks’ cannot be undone"
    return
  }
  if (hasConfirmedThanks.value) {
    showThankConfirmation()
  } else {
    thankDialogOpen.value = true
  }
}

function markEditReviewed(): void {
  confirmationToastType.value = 'success'
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
  if (reviewed && props.changeIndex < props.changeCount - 1) emit('navigate', 1)
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
    toolbarDiffObserver?.disconnect()
    diffFrame.value?.closest('.diff-preview__body')?.scrollTo(0, 0)
    void loadWikipediaVisualDiff()
  },
  { immediate: true },
)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

function userPageUrl(): string {
  return `${import.meta.env.BASE_URL}template-user-page-readonly?username=${encodeURIComponent(props.change.editor)}${localeQuery()}`
}

function openUserPage() {
  window.open(userPageUrl(), '_blank', 'noopener,noreferrer')
}

function openFullDiff(_mobile = false) {
  const url = `${import.meta.env.BASE_URL}template-full-diff-readonly?title=${encodeURIComponent(props.change.title)}${localeQuery()}`
  window.open(url, '_blank', 'noopener,noreferrer')
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
        'diff-preview--complete': props.complete,
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
        <strong id="diff-preview-title">Difference preview</strong>
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

      <section v-if="props.complete" class="mobile-queue-complete" role="status">
        <img class="mobile-complete-illustration" :src="completionIllustration" alt="" />
        <div class="mobile-complete-copy">
        <h2>Well done! You’ve reviewed all changes.</h2>
        <p>Check back later for more, explore <a href="https://en.wikipedia.org/wiki/Special:RecentChanges">Recent Changes</a> or return to <RouterLink :to="{ path: '/template-dashboard-mobile-watch', query: { version: 'B' } }">Home</RouterLink>.</p>
        </div>
      </section>
      <div v-else
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
              :disabled="props.mobileVersion !== 'B' && props.changeIndex === props.changeCount - 1"
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
          <div class="diff-preview__page-links"><a class="diff-preview__full-difference-link" :href="fullDifferenceUrl()" target="_blank" rel="noopener noreferrer">Full difference</a>
        <CdxButton ref="headerWatchAnchor" weight="quiet" :icon-only="true"
          :aria-label="watchPeriods[props.change.title] ? 'Unwatch page' : 'Watch page'"
          :aria-pressed="!!watchPeriods[props.change.title]" :aria-expanded="watchOpen"
          aria-controls="mobile-watch-popover" @click="toggleWatch">
          <CdxIcon :icon="!watchPeriods[props.change.title] ? cdxIconStar : watchPeriods[props.change.title] === 'infinite' ? cdxIconUnStar : cdxIconHalfStar" />
        </CdxButton>
          </div>
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
        v-if="!props.complete && props.variant === 'card'"
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
          <CdxButton action="progressive" @click="requestThanks">
            {{ thankedChanges.has(props.change.title) ? 'Thanked' : 'Thank' }}
          </CdxButton>
          <CdxButton @click="requestUndo">{{ props.undone ? 'Restore' : 'Undo' }}</CdxButton>
          <CdxButton @click="markEditReviewed">
            {{ reviewedChanges.has(props.change.title) ? 'Reviewed' : 'Review' }}
          </CdxButton>
        </div>
      </footer>

      <footer
        v-else-if="!props.complete && props.variant === 'toolbar'"
        class="diff-preview__toolbar"
        aria-label="Diff review actions"
      >
        <div v-if="confirmationToast" class="mobile-toolbar-confirmation">
          <CdxToast
            standalone
            render-in-place
            class="mobile-prototype-toast mobile-toolbar-toast"
            :type="confirmationToastType"
            :prevent-user-dismiss="false"
            :auto-dismiss="true"
            @auto-dismissed="clearConfirmationToast"
            @user-dismissed="clearConfirmationToast"
          >
            {{ confirmationToast }}
          </CdxToast>
        </div>
        <CdxButton
          weight="quiet"
          :class="{ 'mobile-labeled-action': props.mobileVersion !== 'B' }" :icon-only="props.mobileVersion === 'B'"
          :aria-label="props.mobileVersion === 'B' && props.undone ? 'Undone' : 'Undo'"
          @click="requestUndo"
        >
          <CdxIcon :icon="filledUndoIcon" />
          <span v-if="props.mobileVersion !== 'B'">Undo</span>
        </CdxButton>
        <CdxButton
          weight="quiet"
          :class="{ 'mobile-labeled-action': props.mobileVersion !== 'B' }" :icon-only="props.mobileVersion === 'B'"
          :aria-label="props.mobileVersion === 'B' && thankedChanges.has(props.change.title) ? 'Thanked' : 'Thank'"
          @click="requestThanks"
        >
          <CdxIcon :icon="cdxIconUserTalk" />
          <span v-if="props.mobileVersion !== 'B'">Thank</span>
        </CdxButton>
        <CdxButton
          weight="quiet"
          :class="{ 'mobile-labeled-action': props.mobileVersion !== 'B' }" :icon-only="props.mobileVersion === 'B'"
          aria-label="Previous change"
          :disabled="props.changeIndex === 0"
          @click="emit('navigate', -1)"
        >
          <CdxIcon :icon="cdxIconPrevious" />
          <span v-if="props.mobileVersion !== 'B'">Back</span>
        </CdxButton>
        <CdxButton
          weight="quiet"
          :class="{ 'mobile-labeled-action': props.mobileVersion !== 'B' }" :icon-only="props.mobileVersion === 'B'"
          aria-label="Next change"
          :disabled="props.mobileVersion !== 'B' && props.changeIndex === props.changeCount - 1"
          @click="emit('navigate', 1)"
        >
          <CdxIcon :icon="cdxIconNext" />
          <span v-if="props.mobileVersion !== 'B'">Next</span>
        </CdxButton>
      </footer>
      <CdxPopover v-if="props.variant === 'toolbar'" id="mobile-watch-popover"
        v-model:open="watchOpen" :anchor="headerWatchAnchor" placement="bottom-end"
        use-bottom-sheet use-close-button
        :title="watchPeriods[props.change.title] ? 'Added to watchlist' : 'Removed from watchlist'">
        <p>“<a :href="`https://${props.change.wikiHost ?? 'en.wikipedia.org'}/wiki/${encodeURIComponent(props.change.title.replaceAll(' ', '_'))}`">{{ props.change.title }}</a>” and its talk page have been {{ watchPeriods[props.change.title] ? 'added to' : 'removed from' }} your <a href="#" @click.prevent>watchlist</a>.</p>
        <fieldset v-if="watchPeriods[props.change.title]" class="mobile-watch-periods">
          <legend>Watchlist time period</legend>
          <CdxRadio v-for="option in watchOptions" :key="option.value"
            v-model="watchPeriods[props.change.title]" name="mobile-watch-period" :input-value="option.value">{{ option.label }}</CdxRadio>
        </fieldset>
      </CdxPopover>
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
      v-if="confirmationToast && props.variant !== 'toolbar'"
      standalone
      class="mobile-prototype-toast"
      :type="confirmationToastType"
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
.mobile-queue-complete { min-height: 0; overflow-y: auto; text-align: start; }
.mobile-complete-illustration { display: block; width: 100%; height: auto; background: #eaf3ff; }
.mobile-complete-copy { padding: var(--spacing-150, 24px); font-family: var(--font-family-base, sans-serif); font-size: var(--font-size-medium, 1rem); line-height: var(--line-height-medium, 1.625rem); color: var(--color-base, #202122); }
.mobile-complete-copy h2 { margin: 0 0 var(--spacing-100, 16px); padding: 0; border: 0; font-family: var(--font-family-base, sans-serif); font-size: var(--font-size-medium, 1rem); line-height: var(--line-height-medium, 1.625rem); font-weight: var(--font-weight-bold, 700); }
.mobile-complete-copy p { margin: 0; font-family: var(--font-family-base, sans-serif); font-size: var(--font-size-medium, 1rem); line-height: var(--line-height-medium, 1.625rem); font-weight: var(--font-weight-normal, 400); }
.diff-preview__page-links { display: flex; align-items: center; gap: 8px; margin-inline-start: auto; }
.diff-preview__toolbar .mobile-labeled-action { flex: 1 1 0; min-width: 0; flex-direction: column; gap: 6px; padding: 8px 0; font-weight: 400; }
.mobile-labeled-action span { font-size: 14px; line-height: 20px; }

.mobile-toolbar-confirmation {
  position: absolute;
  bottom: calc(100% + 8px);
  inset-inline: 16px;
  pointer-events: none;
}

.mobile-toolbar-confirmation :deep(.cdx-toast) {
  position: relative;
  bottom: auto;
  left: 50%;
  width: 100%;
  max-width: none;
  pointer-events: auto;
}

.mobile-toolbar-confirmation :deep(.cdx-toast-enter-from),
.mobile-toolbar-confirmation :deep(.cdx-toast-leave-to) {
  transform: translateX(-50%);
}

:global(#mobile-watch-popover .cdx-popover__body) {
  flex-shrink: 0;
  overflow: visible;
}

.diff-preview--toolbar .diff-preview__metadata .diff-preview__full-difference-link { font-size: var(--font-size-medium, 1rem); line-height: var(--line-height-medium, 1.625); font-weight: var(--font-weight-normal, 400); color: var(--color-progressive, #36c); text-decoration: none; white-space: nowrap; }
.diff-preview__full-difference-link:hover { text-decoration: underline; }
.mobile-watch-periods { border: 0; padding: 0; margin: 16px 0 0; min-width: 240px; }
.mobile-watch-periods legend { font-weight: 700; margin-bottom: 12px; }

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
  position: relative;
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

/* Keep one vertical scroll surface between the persistent header and toolbar. */
.diff-preview--toolbar.diff-preview--page {
  height: 100dvh;
  min-height: 0;
  overflow: hidden;
}
.diff-preview--toolbar .diff-preview__body {
  display: block;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior-y: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color-subtle, #c8ccd1) transparent;
}
.diff-preview--toolbar .diff-preview__body::-webkit-scrollbar { width: 4px; }
.diff-preview--toolbar .diff-preview__body::-webkit-scrollbar-thumb {
  background: var(--border-color-subtle, #c8ccd1);
  border-radius: 4px;
}
.diff-preview--toolbar .visual-diff-frame { min-height: 0; flex: none; }
.diff-preview--toolbar .visual-diff { height: auto; }
.diff-preview--toolbar .diff-preview__header,
.diff-preview--toolbar .diff-preview__toolbar { z-index: 3; background: var(--background-color-base); }
</style>

<style scoped>
.mobile-complete-copy a, .mobile-complete-copy a:visited { color: var(--color-progressive, #36c); }
</style>

<style scoped>
.diff-preview__toolbar.mobile-completion-actions { justify-content: flex-end; gap: 12px; }
</style>

<style scoped>
.diff-preview--complete { grid-template-rows: auto minmax(0, 1fr); }
</style>
