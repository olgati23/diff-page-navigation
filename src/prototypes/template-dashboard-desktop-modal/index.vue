<script setup lang="ts">
import {
  CdxButton,
  CdxPopover,
  CdxSelect,
  CdxField,
  CdxProgressBar,
  CdxDialog,
  CdxIcon,
  CdxTextInput,
  CdxToast,
  CdxMessage,
} from '@wikimedia/codex'
import {
  cdxIconCheck,
  cdxIconStar,
  cdxIconHalfStar,
  cdxIconUnStar,
  cdxIconReload,
  cdxIconPushPin,
  cdxIconEdit,
  cdxIconEditUndo,
  cdxIconCollapse,
  cdxIconNext,
  cdxIconPrevious,
  cdxIconExpand,
  cdxIconHeartOutline,
  cdxIconMessage,
  cdxIconUserAvatar,
  cdxIconUserTalk,
} from '@wikimedia/codex-icons'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ReviewEditCard from './ReviewEditCard.vue'

import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import { useConfig } from '@/composables/useConfig'
import Dashboard from '@/components/dashboard/Dashboard.vue'
import DashboardModule from '@/components/dashboard/DashboardModule.vue'
import SpecialPageWrapper from '@/components/SpecialPageWrapper.vue'
import type { Skin } from '@/theme'
import WikipediaDiffContent from './review-changes/WikipediaDiffContent.vue'
import ThankConfirmationDialog from './review-changes/ThankConfirmationDialog.vue'
import UndoConfirmationDialog from './review-changes/UndoConfirmationDialog.vue'
import { reviewChanges as sourceReviewChanges, type ReviewChange } from './reviewChanges'
import { localeQuery } from '../prototypeLocale'

definePage({
  alias: '/template-dashboard-desktop-modal/all-review-changes',
  meta: {
    title: 'Template: Dashboard',
    description: 'Template for dashboard prototypes that contain "box modules".',
  },
})

const { pageTitle } = useConfig()
const dashboardView: Skin = 'desktop'
const isGermanPrototype = /-de(?:\/|$)/.test(window.location.pathname)
const isThaiPrototype = window.location.pathname.includes('-th')
const isHebrewPrototype = window.location.pathname.includes('-he')
const viewportWidth = ref(window.innerWidth)
const germanMetadataWrapped = computed(
  () => isGermanPrototype && viewportWidth.value < 760,
)
const expandedReviewChange = ref<string | null>(null)
const desktopReviewPresentation = ref('modal')
const modalReviewIndex = ref<number | null>(null)
const modalQueueComplete = ref(false)
const undoDialogOpen = ref(false)
const thankDialogOpen = ref(false)
const watchedChanges = reactive(new Set<string>())
const watchAnchor = ref(null)
const watchFooterAnchor = ref(null)
const watchPopoverOpen = ref(false)
const watchPeriods = reactive<Record<string, string>>({})
const watchPeriodOptions = [
  { label: 'Permanent', value: 'infinite' },
  ...['1 week', '1 month', '3 months', '6 months', '1 year'].map(value => ({ label: value, value })),
]
let watchDismissTimer: ReturnType<typeof setTimeout> | undefined
function pauseWatchDismiss() { clearTimeout(watchDismissTimer) }
function scheduleWatchDismiss() {
  pauseWatchDismiss()
  watchDismissTimer = setTimeout(() => { watchPopoverOpen.value = false }, 8000)
}
function closeWatchPopover() {
  watchPopoverOpen.value = false
  pauseWatchDismiss()
}
function toggleWatch(title: string) {
  if (watchedChanges.has(title)) watchedChanges.delete(title)
  else {
    watchedChanges.add(title)
    watchPeriods[title] = 'infinite'
  }
  watchPopoverOpen.value = true
  scheduleWatchDismiss()
}
function setWatchPeriod(value: string | number) {
  watchPeriods[modalReviewChange.value.title] = String(value)
  scheduleWatchDismiss()
}
onBeforeUnmount(pauseWatchDismiss)
const confirmationToast = ref('')
const confirmationToastType = ref<'success' | 'notice'>('success')
const route = useRoute()
const router = useRouter()
const queueVersion = computed<'A' | 'B1' | 'B2' | 'C'>(() => route.query.version === 'C' ? 'C' : route.query.version === 'B2' ? 'B2' : ['B', 'B1'].includes(String(route.query.version)) ? 'B1' : 'A')
const isBVersion = computed(() => queueVersion.value === 'B1' || queueVersion.value === 'B2')
const watchInFooter = computed(() => queueVersion.value === 'A' || queueVersion.value === 'B2')
const MAX_EDITS = 20
const reviewChanges = sourceReviewChanges.slice(0, MAX_EDITS)
const dashboardPath = '/template-dashboard-desktop-modal'
const showAllEdits = computed(() => route.path.endsWith('/all-review-changes') || route.query.view === 'all')
const createQueueState = () => ({ seen: new Set<string>(), reviewed: new Set<string>(), thanked: new Set<string>(), undone: new Set<string>(), completed: new Set<string>(), limit: 7 })
// Seen or acted-on B edits remain visible until the next visit.
const retiredStorageKey = 'protowiki-desktop-review-b-completed-v1'
function readRetiredEdits(): Set<string> {
  try {
    const saved = JSON.parse(sessionStorage.getItem(retiredStorageKey) ?? '[]')
    return new Set(Array.isArray(saved) ? saved.filter(value => typeof value === 'string') : [])
  } catch { return new Set() }
}
const retiredBEdits = ref(readRetiredEdits())
const cStorageKey = 'protowiki-desktop-review-c-v1'
function readCState() {
  try { return JSON.parse(sessionStorage.getItem(cStorageKey) ?? '{}') } catch { return {} }
}
const savedCState = readCState()
const pinnedChanges = ref(new Set<string>(Array.isArray(savedCState.pinned) ? savedCState.pinned : []))
const retiredCEdits = ref(new Set<string>(Array.isArray(savedCState.retired) ? savedCState.retired : []))
function saveCState() {
  try {
    sessionStorage.setItem(cStorageKey, JSON.stringify({ pinned: [...pinnedChanges.value], retired: [...new Set([...retiredCEdits.value, ...queues.C.seen, ...queues.C.completed])].filter(title => !pinnedChanges.value.has(title)) }))
  } catch { /* Keep the prototype usable without storage. */ }
}
function togglePin(changeTitle?: string) {
  const title = changeTitle ?? modalReviewChange.value.title
  if (pinnedChanges.value.has(title)) pinnedChanges.value.delete(title)
  else pinnedChanges.value.add(title)
  queues.C.seen.add(title)
  queues.C.completed.add(title)
  saveCState()
  confirmationToastType.value = 'success'
  confirmationToast.value = pinnedChanges.value.has(title) ? 'Edit pinned to the top of your queue' : 'Edit unpinned'
}
const refreshExplanationOpen = ref(false)
const refreshExplanationAcknowledged = ref(false)
function refreshBQueue() {
  refreshExplanationAcknowledged.value = true
  refreshExplanationOpen.value = false
  if (queueVersion.value === 'C') {
    retiredCEdits.value = new Set([...retiredCEdits.value, ...queues.C.seen, ...queues.C.completed].filter(title => !pinnedChanges.value.has(title)))
    saveCState()
    queues.C.completed.clear()
  } else {
    retiredBEdits.value = new Set([...retiredBEdits.value, ...queues.B.completed])
    queues.B.completed.clear()
  }
  confirmationToastType.value = 'success'
  confirmationToast.value = 'Your edit queue has been refreshed'
}
function requestBQueueRefresh() {
  if (refreshExplanationAcknowledged.value) refreshBQueue()
  else refreshExplanationOpen.value = true
}
const retiredAEdits = ref(new Set<string>())
const refreshingAQueue = ref(false)
const queueIsLoading = computed(() => queueVersion.value === 'A' && refreshingAQueue.value)
let queueRefreshTimer: ReturnType<typeof setTimeout> | undefined
function refreshCompletedAEdits() {
  const completed = [...new Set([...queues.A.seen, ...queues.A.completed])].filter(title => !retiredAEdits.value.has(title))
  if (!completed.length || refreshingAQueue.value) return
  refreshingAQueue.value = true
  // Simulate fetching replacement edits while retaining the gray cards beneath the loader.
  queueRefreshTimer = setTimeout(() => {
    retiredAEdits.value = new Set([...retiredAEdits.value, ...completed])
    refreshingAQueue.value = false
    queueRefreshTimer = undefined
  }, 1000)
}
onBeforeUnmount(() => clearTimeout(queueRefreshTimer))
const queues = reactive({ A: createQueueState(), B: createQueueState(), C: createQueueState() })
const queueState = computed(() => queues[isBVersion.value ? 'B' : queueVersion.value])
const reviewedChanges = computed({ get: () => queueState.value.reviewed, set: value => { queueState.value.reviewed = value } })
const thankedChanges = computed({ get: () => queueState.value.thanked, set: value => { queueState.value.thanked = value } })
const undoneChanges = computed({ get: () => queueState.value.undone, set: value => { queueState.value.undone = value } })
const availableChanges = computed(() => {
  if (queueVersion.value === 'C') {
    return [
      ...reviewChanges.filter(change => pinnedChanges.value.has(change.title)),
      ...reviewChanges.filter(change => !pinnedChanges.value.has(change.title) && !retiredCEdits.value.has(change.title)),
    ]
  }
  return reviewChanges.filter(change => isBVersion.value ? !retiredBEdits.value.has(change.title) : !retiredAEdits.value.has(change.title))
})
const fullQueueLimit = computed(() => queueVersion.value === 'B1' ? MAX_EDITS : queueState.value.limit)
const visibleChanges = computed(() => availableChanges.value.slice(0, showAllEdits.value ? fullQueueLimit.value : 2))
const showReviewedEmptyState = computed(() =>
  modalReviewIndex.value === null && !queueIsLoading.value && !(queueVersion.value === 'C' && pinnedChanges.value.size) && reviewChanges.every(change =>
    (!isBVersion.value && queueState.value.completed.has(change.title)) ||
    (queueVersion.value === 'A' ? retiredAEdits.value : queueVersion.value === 'C' ? retiredCEdits.value : retiredBEdits.value).has(change.title),
  ),
)
const hasMoreEdits = computed(() => fullQueueLimit.value < availableChanges.value.length)
function setQueueVersion(version: 'A' | 'B1' | 'B2' | 'C') {
  refreshExplanationOpen.value = false
  updateReviewModalOpen(false)
  router.replace({ path: route.path, query: { ...route.query, version } })
}
function openAllEdits() {
  const { view, ...query } = route.query
  router.push({ path: `${dashboardPath}/all-review-changes`, query: { ...query, version: queueVersion.value, view: 'all' } })
  window.scrollTo(0, 0)
}
function returnToDashboard() {
  updateReviewModalOpen(false)
  const { view, ...query } = route.query
  router.push({ path: dashboardPath, query: { ...query, version: queueVersion.value, view: 'dashboard' } })
  window.scrollTo(0, 0)
}
function saveBState() {
  try {
    sessionStorage.setItem(retiredStorageKey, JSON.stringify([...new Set([...retiredBEdits.value, ...queues.B.seen, ...queues.B.completed])]))
  } catch { /* Keep the prototype usable without storage. */ }
}
watch([showAllEdits, queueVersion], ([all, version], [wasAll, previousVersion]) => {
  if (all && ['B1', 'B2'].includes(version) && (!wasAll || !['B1', 'B2'].includes(previousVersion))) {
    retiredBEdits.value = new Set([...retiredBEdits.value, ...queues.B.seen, ...queues.B.completed])
    saveBState()
  }
})
function completeQueueAction(title: string) {
  queueState.value.seen.add(title)
  queueState.value.completed.add(title)
  if (queueVersion.value === 'C') saveCState()
  if (isBVersion.value) saveBState()
}
function resetQueues() {
  closeWatchPopover()
  watchedChanges.clear()
  refreshExplanationOpen.value = false
  refreshExplanationAcknowledged.value = false
  updateReviewModalOpen(false)
  clearTimeout(queueRefreshTimer)
  refreshingAQueue.value = false
  retiredAEdits.value = new Set()
  queues.A = createQueueState()
  queues.B = createQueueState()
  queues.C = createQueueState()
  pinnedChanges.value = new Set()
  retiredCEdits.value = new Set()
  try { sessionStorage.removeItem(cStorageKey) } catch { /* Storage may be unavailable. */ }
  retiredBEdits.value = new Set()
  try { sessionStorage.removeItem(retiredStorageKey) } catch { /* Storage may be unavailable. */ }
}
function openChange(change: ReviewChange) {
  if (queueIsLoading.value) return
  openReviewModal(desktopReviewChanges.findIndex(item => item.title === change.title))
}
function adjacentReviewChange(direction: -1 | 1): ReviewChange | undefined {
  if (modalReviewIndex.value === null) return undefined
  const navigationChanges = queueVersion.value === 'B2' ? availableChanges.value : visibleChanges.value
  const position = navigationChanges.findIndex(change => change.title === modalReviewChange.value.title)
  if (position >= 0) return navigationChanges[position + direction]
  const candidates = direction === 1 ? navigationChanges : [...navigationChanges].reverse()
  return candidates.find(change => {
    const index = desktopReviewChanges.indexOf(change)
    return direction === 1 ? index > modalReviewIndex.value! : index < modalReviewIndex.value!
  })
}
const modalConfirmation = ref<'undo' | 'thank' | null>(null)
const modalUndoReason = ref('')

watch(desktopReviewPresentation, () => {
  expandedReviewChange.value = null
  modalReviewIndex.value = null
  undoDialogOpen.value = false
  thankDialogOpen.value = false
  modalConfirmation.value = null
})

function updateViewportWidth(): void {
  viewportWidth.value = window.innerWidth
}

onMounted(() => window.addEventListener('resize', updateViewportWidth))
onBeforeUnmount(() => window.removeEventListener('resize', updateViewportWidth))

const desktopReviewChanges = reviewChanges

const modalReviewChange = computed(
  () => desktopReviewChanges[modalReviewIndex.value ?? 0],
)
const modalRevisionDate = computed(() =>
  modalReviewChange.value.revisionDate.replace(/^(.*),\s*(\d{1,2}:\d{2})$/, '$2, $1'),
)

const activeReviewEditor = computed(() => {
  if (modalReviewIndex.value !== null) return modalReviewChange.value.editor
  return desktopReviewChanges.find((change) => change.title === expandedReviewChange.value)?.editor ??
    desktopReviewChanges[0].editor
})

function openReviewModal(index: number): void {
  modalQueueComplete.value = false
  closeWatchPopover()
  clearConfirmationToast()
  if (desktopReviewPresentation.value === 'modal') {
    modalReviewIndex.value = index
    queueState.value.seen.add(desktopReviewChanges[index].title)
    if (isBVersion.value) saveBState()
    if (queueVersion.value === 'C') saveCState()
  }
}

function moveReviewModal(direction: -1 | 1): void {
  if (modalReviewIndex.value === null) return
  const next = adjacentReviewChange(direction)
  if (next) openChange(next)
  else if (direction === 1) {
    closeWatchPopover()
    clearConfirmationToast()
    modalQueueComplete.value = true
  }
}

function updateReviewModalOpen(open: boolean): void {
  if (!open) closeWatchPopover()
  if (!open) {
    clearConfirmationToast()
    if (modalReviewIndex.value !== null && queueVersion.value === 'A') refreshCompletedAEdits()
    modalReviewIndex.value = null
    modalQueueComplete.value = false
    modalConfirmation.value = null
  }
}

function showUndoConfirmation(): void {
  confirmationToastType.value = 'success'
  confirmationToast.value = 'Your edit was saved'
  const title = modalReviewIndex.value !== null ? modalReviewChange.value.title : expandedReviewChange.value
  if (!title) return
  const undone = new Set(undoneChanges.value)
  undone.add(title)
  undoneChanges.value = undone
  const reviewed = new Set(reviewedChanges.value)
  reviewed.delete(title)
  reviewedChanges.value = reviewed
  completeQueueAction(title)
}

function displayedChange(change: ReviewChange): ReviewChange {
  if (!undoneChanges.value.has(change.title)) return change
  return { ...change, revisionId: change.oldRevisionId, oldRevisionId: change.revisionId, summary: `Undo: ${change.summary}` }
}

function requestUndo(changeTitle?: string): void {
  const title = changeTitle ?? modalReviewChange.value.title
  if (undoneChanges.value.has(title)) {
    const next = new Set(undoneChanges.value)
    next.delete(title)
    undoneChanges.value = next
    confirmationToastType.value = 'success'
    confirmationToast.value = 'Edit restored'
    return
  }
  if (modalReviewIndex.value !== null) openModalConfirmation('undo')
  else undoDialogOpen.value = true
}

function showThankConfirmation(): void {
  const title = modalReviewIndex.value !== null ? modalReviewChange.value.title : expandedReviewChange.value
  if (title) {
    const next = new Set(thankedChanges.value)
    next.add(title)
    thankedChanges.value = next
  }
  confirmationToastType.value = 'success'
  confirmationToast.value = `You thanked ${activeReviewEditor.value}`
  if (title) completeQueueAction(title)
}

function requestThanks(changeTitle?: string): void {
  const title = changeTitle ?? modalReviewChange.value.title
  if (thankedChanges.value.has(title)) {
    confirmationToastType.value = 'notice'
    confirmationToast.value = "A 'Thanks' cannot be undone"
    return
  }
  openModalConfirmation('thank')
}

function markEditReviewed(changeTitle?: string): void {
  const title = changeTitle ?? modalReviewChange.value.title
  reviewedChanges.value = new Set([...reviewedChanges.value, title])
  queueState.value.seen.add(title)
  confirmationToastType.value = 'success'
  confirmationToast.value = 'Edit marked as viewed for you only'
  completeQueueAction(title)
}

function fullDiffUrl(change: ReviewChange): string {
  return `${import.meta.env.BASE_URL}template-full-diff-readonly?title=${encodeURIComponent(change.title)}${localeQuery()}`
}

function userPageUrl(editor: string): string {
  return `${import.meta.env.BASE_URL}template-user-page-readonly?username=${encodeURIComponent(editor)}${localeQuery()}`
}

function clearConfirmationToast(): void {
  confirmationToast.value = ''
}


function openModalConfirmation(action: 'undo' | 'thank'): void {
  modalConfirmation.value = action
  if (action === 'undo') modalUndoReason.value = ''
}

function confirmModalAction(): void {
  if (modalConfirmation.value === 'undo') showUndoConfirmation()
  if (modalConfirmation.value === 'thank') showThankConfirmation()
  modalConfirmation.value = null
}

/** Gallery / app home (file-based route `/`). */
const HOME = '/'
const REVIEW_CHANGES_ROUTE = '/template-dashboard/review-changes'

/** Shared across mobile + desktop for each matching module */
const MODULE = {
  thankTitle: 'Review changes',
  impactTitle: 'Your impact',
} as const

function randomWholeNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Demo values change whenever the prototype is refreshed. */
const impact = {
  thanksSent: randomWholeNumber(4, 24),
  editsCompleted: randomWholeNumber(12, 96),
}

</script>

<template>
  <ChromeWrapper :skin="dashboardView" :last-edited-notice="false">
    <SpecialPageWrapper :title="showAllEdits ? null : pageTitle" :actions="!showAllEdits">
      <template v-if="!showAllEdits" #actions>
        <div class="dashboard-view-control">
          <RouterLink :to="HOME" class="dashboard-header-feedback">
            Share feedback
          </RouterLink>
        </div>
      </template>

      <nav v-if="!showAllEdits" class="queue-version-switch" aria-label="Prototype version">
        <span v-if="!showAllEdits">Desktop review changes</span>
        <CdxButton v-for="version in (['A', 'B1', 'B2', 'C'] as const)" :key="version"
          :action="queueVersion === version ? 'progressive' : 'default'"
          :weight="queueVersion === version ? 'primary' : 'normal'"
          :aria-pressed="queueVersion === version" @click="setQueueVersion(version)">Version {{ version }}</CdxButton>
        <CdxButton weight="quiet" @click="resetQueues">Reset prototype</CdxButton>
      </nav>
      <div v-if="showAllEdits" class="all-review-layout">
        <aside class="all-review-contents" aria-label="Contents">
          <strong>Contents</strong><hr /><b>(Top)</b>
          <a href="#review-changes">Review changes</a>
        </aside>
        <main class="all-review-main">
          <div class="all-review-title-row">
          <h1>Hello, NewEditor!</h1>
      <nav class="queue-version-switch" aria-label="Prototype version">
        <CdxButton v-for="version in (['A', 'B1', 'B2', 'C'] as const)" :key="version"
          :action="queueVersion === version ? 'progressive' : 'default'"
          :weight="queueVersion === version ? 'primary' : 'normal'"
          :aria-pressed="queueVersion === version" @click="setQueueVersion(version)">Version {{ version }}</CdxButton>
        <CdxButton weight="quiet" @click="resetQueues">Reset prototype</CdxButton>
      </nav>
          </div>
          <header id="review-changes" class="all-review-heading">
            <CdxButton weight="quiet" :icon-only="true" aria-label="Back to dashboard" @click="returnToDashboard"><CdxIcon :icon="cdxIconPrevious" /></CdxButton>
            <h2>Review changes</h2>
            <CdxButton v-if="queueVersion === 'C'" class="queue-refresh-button" weight="quiet" :action="queueVersion === 'C' ? 'progressive' : 'default'" :icon-only="queueVersion !== 'C'"
              aria-label="Refresh edits" title="Refresh edits" @click="requestBQueueRefresh">
              <CdxIcon :icon="cdxIconReload" />
              <span v-if="queueVersion === 'C'">Refresh edits</span>
            </CdxButton>
          </header>
          <div v-if="queueIsLoading" class="queue-loading" role="status">
            <CdxProgressBar aria-label="Loading new edits" />
            <span>Loading new edits</span>
          </div>
          <div v-if="!showReviewedEmptyState" class="all-review-list" :aria-busy="queueIsLoading">
            <ReviewEditCard v-for="change in visibleChanges" :key="change.title" :change="change" expanded
              :seen="queueState.seen.has(change.title) || (queueVersion === 'C' && pinnedChanges.has(change.title))"

              :pinned="queueVersion === 'C' && pinnedChanges.has(change.title)"
                  @unpin="togglePin(change.title)" @open="openChange(change)" />
          </div>
          <div v-if="showReviewedEmptyState" class="queue-empty" role="status">
            <p v-if="queueVersion === 'B2'">Well done! You’ve reviewed all changes. Check back later for more or explore <a href="https://en.wikipedia.org/wiki/Special:RecentChanges">Recent Changes</a>.</p>
            <p v-else>You’ve reviewed all changes. Check back tomorrow, explore <a href="https://en.wikipedia.org/wiki/Special:RecentChanges">Recent Changes</a>, or return to <RouterLink :to="{ path: dashboardPath, query: { ...route.query, view: 'dashboard' } }" @click.prevent="returnToDashboard">Home</RouterLink>.</p>
          </div>
          <CdxButton v-if="!showReviewedEmptyState && hasMoreEdits" class="view-more-edits" @click="queueState.limit = Math.min(queueState.limit + 7, MAX_EDITS)">Show more edits</CdxButton>
          <p v-if="queueVersion !== 'B1' && !showReviewedEmptyState && !hasMoreEdits" class="queue-end">
            <template v-if="queueVersion === 'B2'">Check back later for more changes or explore <a href="https://en.wikipedia.org/wiki/Special:RecentChanges">Recent Changes</a>.</template>
            <template v-else>{{ isBVersion ? 'There are no more changes for now. Check back later, explore ' : 'You’ve reviewed all changes. Check back tomorrow, explore ' }}<a href="https://en.wikipedia.org/wiki/Special:RecentChanges">Recent Changes</a>, or return to <RouterLink :to="{ path: dashboardPath, query: { ...route.query, view: 'dashboard' } }" @click.prevent="returnToDashboard">Home</RouterLink>.</template>
          </p>
        </main>
        <aside class="all-review-tools" aria-label="Tools">
          <strong>Tools</strong><hr />
          <p>General</p><hr />
          <a href="https://en.wikipedia.org/wiki/Special:RecentChanges" target="_blank" rel="noopener noreferrer">Related changes</a>
          <a href="https://en.wikipedia.org/wiki/Special:SpecialPages" target="_blank" rel="noopener noreferrer">Special pages</a>
          <a href="https://en.wikipedia.org/wiki/Help:Contents" target="_blank" rel="noopener noreferrer">Help</a>
        </aside>
      </div>
      <div v-else class="template-dashboard-shell">
        <Dashboard>
          <template #banner>
            <RouterLink :to="HOME" class="dashboard-mobile-banner__feedback">
              Share feedback
            </RouterLink>
          </template>

          <template #mobile>
            <DashboardModule
              class="dashboard-slot--mobile-primary"
              :to="REVIEW_CHANGES_ROUTE"
              :title="MODULE.thankTitle"
              cta="Show more edits"
            >
              <p class="dashboard-preview-line">
                <CdxIcon :icon="cdxIconEdit" size="small" aria-hidden="true" />
                <span>{{ reviewChanges[0].editor }} edited the {{ reviewChanges[0].title }} article</span>
              </p>
            </DashboardModule>

            <DashboardModule
              class="dashboard-active-discussions-mobile"
              :to="HOME"
              title="Active discussions"
              cta="View more"
            >
              <p class="dashboard-preview-line dashboard-preview-line--stacked">
                <CdxIcon :icon="cdxIconMessage" size="small" aria-hidden="true" />
                <span><em>What should mentorship be?</em><br />Latest comment: <span class="dashboard-preview-link">18 minutes ago</span></span>
              </p>
            </DashboardModule>

            <DashboardModule class="dashboard-slot--mobile-sidebar" :title="MODULE.impactTitle">
              <div class="dashboard-impact-rows">
                <div class="dashboard-impact-row">
                  <CdxIcon
                    :icon="cdxIconUserTalk"
                    size="small"
                    class="dashboard-impact-icon"
                  />
                  <span class="dashboard-impact-metric">{{ impact.thanksSent }}</span>
                  <span>Thanks sent</span>
                </div>
                <div class="dashboard-impact-row">
                  <CdxIcon
                    :icon="cdxIconCheck"
                    size="small"
                    class="dashboard-impact-icon"
                  />
                  <span class="dashboard-impact-metric">{{ impact.editsCompleted }}</span>
                  <span>Edits reviewed</span>
                </div>
              </div>
            </DashboardModule>

            <DashboardModule
              :to="HOME"
              title="Policies and guidelines"
              :cta="null"
            >
              <p class="dashboard-template-placeholder">Review best practices to create a free and reliable encyclopedia.</p>
            </DashboardModule>
          </template>

          <template #primary>
            <DashboardModule class="desktop-review-module" :title="MODULE.thankTitle">
              <p class="dashboard-module-intro">
                These edits were made by other users. Stay up to date and help maintain Wikipedia’s quality by reviewing them.
              </p>
              <div v-if="queueIsLoading" class="queue-loading" role="status">
            <CdxProgressBar aria-label="Loading new edits" />
            <span>Loading new edits</span>
          </div>
          <div v-if="!showReviewedEmptyState" class="desktop-review-list" :aria-busy="queueIsLoading">
                <ReviewEditCard v-for="change in visibleChanges" :key="change.title" :change="change"
                  :seen="queueState.seen.has(change.title) || (queueVersion === 'C' && pinnedChanges.has(change.title))"

                  :pinned="queueVersion === 'C' && pinnedChanges.has(change.title)"
                  @unpin="togglePin(change.title)" @open="openChange(change)" />
              </div>
              <div v-if="showReviewedEmptyState" class="queue-empty" role="status">
                <p v-if="queueVersion === 'B2'">Well done! You’ve reviewed all changes. Check back later for more or explore <a href="https://en.wikipedia.org/wiki/Special:RecentChanges">Recent Changes</a>.</p>
                <template v-else>
                  <strong>All changes reviewed!</strong>
                  <p>Check back later for new changes.</p>
                </template>
              </div>
              <CdxButton v-else class="view-more-edits" @click="openAllEdits">Show more edits</CdxButton>
            </DashboardModule>
            <DashboardModule title="Active discussions">
              <div class="discussion-list">
                <article v-for="discussion in [
                  ['We need to get rid of the &quot;suggested links&quot; tool', 'Wikipedia:Village pump (proposals)', '22 minutes ago', '53', '16'],
                  ['Category:Category', 'Wikipedia:Village pump (technical)', '2 hours ago', '2', '2'],
                  ['Merge PROSPLIT into AfD?', 'Wikipedia:Village pump (idea_lab)', '2 hours ago', '3', '2'],
                ]" :key="discussion[0]" class="discussion-item">
                  <strong>{{ discussion[0] }}</strong>
                  <span class="discussion-item__counts"><CdxIcon :icon="cdxIconMessage" size="x-small" /> {{ discussion[3] }} &nbsp; <CdxIcon :icon="cdxIconUserAvatar" size="x-small" /> {{ discussion[4] }}</span>
                  <span>{{ discussion[1] }}</span>
                  <span>Latest comment: <a href="#">{{ discussion[2] }}</a></span>
                </article>
              </div>
              <p class="discussion-footer">View more edits in the <a href="#" @click.prevent>recent changes page</a></p>
            </DashboardModule>
          </template>

          <template #sidebar>
            <DashboardModule
              class="dashboard-slot--desktop-sidebar"
              :title="MODULE.impactTitle"
            >
              <div class="dashboard-impact-rows">
                <div class="dashboard-impact-row">
                  <CdxIcon
                    :icon="cdxIconUserTalk"
                    size="small"
                    class="dashboard-impact-icon"
                  />
                  <span class="dashboard-impact-metric">{{ impact.thanksSent }}</span>
                  <span>Thanks sent</span>
                </div>
                <div class="dashboard-impact-row">
                  <CdxIcon
                    :icon="cdxIconCheck"
                    size="small"
                    class="dashboard-impact-icon"
                  />
                  <span class="dashboard-impact-metric">{{ impact.editsCompleted }}</span>
                  <span>Edits reviewed</span>
                </div>
              </div>
            </DashboardModule>
            <DashboardModule title="Policies and guidelines">
              <p class="dashboard-module-intro">Check what is acceptable and expected on Wikipedia.</p>
              <details v-for="policy in [
                ['Neutral point of view', 'Content must represent significant views fairly, proportionately, and without bias.'],
                ['No original research', 'Articles should summarise published sources, and not contain users’ own interpretation or knowledge.'],
                ['Verifiability', 'New additions should include a citation, providing the source of the information.'],
                ['Assume good faith', 'Remember that Wikipedia editors are trying to improve Wikipedia and not deliberately reduce its quality.'],
              ]" :key="policy[0]" class="policy-item" open>
                <summary>{{ policy[0] }}</summary>
                <p>{{ policy[1] }}</p>
              </details>
            </DashboardModule>
          </template>
        </Dashboard>
      </div>

      <CdxDialog v-model:open="refreshExplanationOpen" title="Refresh edits" use-close-button>
        <p class="desktop-modal-confirmation__description">{{ queueVersion === 'C' ? 'Refreshing replaces edits you’ve opened or acted on with new edits. Pinned edits stay at the top of your queue' : 'Refreshing removes edits you’ve thanked, undone, or marked as viewed from your queue and replaces them with new edits' }}</p>
        <div class="desktop-modal-confirmation__actions">
          <CdxButton @click="refreshExplanationOpen = false">Cancel</CdxButton>
          <CdxButton action="progressive" weight="primary" @click="refreshBQueue">Refresh edits</CdxButton>
        </div>
      </CdxDialog>

      <CdxDialog
        :open="modalReviewIndex !== null"
        :title="modalQueueComplete ? 'Difference preview' : modalConfirmation === 'undo'
          ? 'Undo edit'
          : modalConfirmation === 'thank'
            ? 'Publicly send ‘Thanks’'
            : `Difference preview: ${modalReviewChange.title}`"
        :subtitle="modalConfirmation || modalQueueComplete ? undefined : `Revision from ${modalRevisionDate}`"
        :use-close-button="!modalConfirmation"
        class="desktop-review-dialog"
        :class="{
          'desktop-review-dialog--confirmation': modalConfirmation,
          'desktop-review-dialog--german': isGermanPrototype,
        }"
        @update:open="updateReviewModalOpen"
      >
        <template v-if="modalQueueComplete">
        <section class="desktop-review-dialog__complete" role="status">
          <p v-if="queueVersion === 'B2'">Well done! You’ve reviewed all changes. Check back later for more or explore <a href="https://en.wikipedia.org/wiki/Special:RecentChanges">Recent Changes</a>.</p>
          <p v-else>Well done! You’ve reviewed all changes. Check back {{ queueVersion === 'B2' ? 'later' : 'tomorrow' }} for more. In the meantime, explore <a href="https://en.wikipedia.org/wiki/Special:RecentChanges">Recent Changes</a> {{ queueVersion === 'B2' ? 'or' : 'or return to' }} <RouterLink :to="{ path: dashboardPath, query: { version: queueVersion, view: 'dashboard' } }" @click.prevent="returnToDashboard">Home</RouterLink>.</p>
        </section>
        <div class="desktop-review-dialog__footer">
          <div class="desktop-review-dialog__completion-actions">
            <CdxButton size="medium" :icon-only="true" aria-label="Back to last edit"
              @click="modalQueueComplete = false"><CdxIcon :icon="cdxIconPrevious" /></CdxButton>
            <CdxButton size="medium" action="progressive" weight="primary"
              @click="updateReviewModalOpen(false)">Done</CdxButton>
          </div>
        </div>
        </template>
        <template v-else-if="modalConfirmation === 'undo'">
          <p class="desktop-modal-confirmation__description">
            This will undo the change(s) shown in this revision. Please provide a reason for
            undoing the edit(s)
          </p>
          <CdxTextInput
            v-model="modalUndoReason"
            placeholder="eg. Inaccurate information"
            aria-label="Reason for undoing the edit"
          />
          <div class="desktop-modal-confirmation__actions">
            <CdxButton @click="modalConfirmation = null">Cancel</CdxButton>
            <CdxButton action="progressive" weight="normal" @click="confirmModalAction">
              Undo
            </CdxButton>
          </div>
        </template>
        <template v-else-if="modalConfirmation === 'thank'">
          <p class="desktop-modal-confirmation__description">
            It is an easy way to show appreciation for an editor’s work on Wikipedia. ‘Thanks’
            cannot be undone and are publicly viewable
          </p>
          <div class="desktop-modal-confirmation__actions">
            <CdxButton @click="modalConfirmation = null">Cancel</CdxButton>
            <CdxButton action="progressive" weight="normal" @click="confirmModalAction">
              Thank
            </CdxButton>
          </div>
        </template>
        <template v-else>
        <div
          class="desktop-review-dialog__meta"
          :class="{ 'desktop-review-dialog__meta--german': isGermanPrototype }"
        >
          <div class="desktop-review-dialog__user-links">
            <a
              :href="userPageUrl(modalReviewChange.editor)"
              target="_blank"
              rel="noopener noreferrer"
              class="desktop-review-dialog__user"
            >
              <CdxIcon :icon="cdxIconUserAvatar" size="small" />
              {{ modalReviewChange.editor }}
            </a>
            <span aria-hidden="true">(</span>
            <span class="desktop-review-dialog__secondary-user-link">
              {{ isGermanPrototype ? 'Diskussion' : isThaiPrototype ? 'อภิปราย' : isHebrewPrototype ? 'שיחה' : 'talk' }}
            </span>
            <span aria-hidden="true">|</span>
            <span class="desktop-review-dialog__secondary-user-link">
              {{ isGermanPrototype ? 'Beiträge' : isThaiPrototype ? 'เรื่องที่เขียน' : isHebrewPrototype ? 'תרומות' : 'contribs' }}
            </span>
            <span aria-hidden="true">)</span>
          </div>
          <div class="desktop-review-dialog__page-actions">
          <a
            :href="fullDiffUrl(modalReviewChange)"
            target="_blank"
            rel="noopener noreferrer"
            class="desktop-review-dialog__full-diff"
          >
            Full difference
          </a>
          <CdxButton v-if="!watchInFooter" ref="watchAnchor" weight="quiet" size="medium" :icon-only="true"
            :aria-expanded="watchPopoverOpen" aria-controls="watch-page-popover"
            :aria-label="watchedChanges.has(modalReviewChange.title) ? 'Unwatch article' : 'Watch article'"
            :title="watchedChanges.has(modalReviewChange.title) ? 'Unwatch article' : 'Watch article'"
            :aria-pressed="watchedChanges.has(modalReviewChange.title)"
            @click="toggleWatch(modalReviewChange.title)">
            <CdxIcon :icon="watchedChanges.has(modalReviewChange.title) ? (watchPeriods[modalReviewChange.title] === 'infinite' ? cdxIconUnStar : cdxIconHalfStar) : cdxIconStar" />
          </CdxButton>
          </div>
        </div>
          <CdxPopover id="watch-page-popover" v-model:open="watchPopoverOpen"
            :anchor="watchInFooter ? watchFooterAnchor : watchAnchor" :placement="watchInFooter ? 'top-end' : 'bottom-end'" render-in-place
            :title="watchedChanges.has(modalReviewChange.title) ? 'Added to watchlist' : 'Removed from watchlist'"
            use-close-button close-button-label="Close watchlist popover">
            <div class="watch-popover-content" @mouseenter="pauseWatchDismiss" @mouseleave="scheduleWatchDismiss"
              @focusin="pauseWatchDismiss" @focusout="scheduleWatchDismiss">
              <p>“{{ modalReviewChange.title }}” and its talk page have been {{ watchedChanges.has(modalReviewChange.title) ? 'added to' : 'removed from' }} your watchlist.</p>
              <CdxField v-if="watchedChanges.has(modalReviewChange.title)">
                <template #label>Watchlist time period:</template>
                <CdxSelect :selected="watchPeriods[modalReviewChange.title] ?? 'infinite'"
                  :menu-items="watchPeriodOptions" @update:selected="setWatchPeriod" />
              </CdxField>
            </div>
          </CdxPopover>
        <div class="desktop-review-dialog__diff">
          <WikipediaDiffContent
            :change="displayedChange(modalReviewChange)"
            tall
            :show-heading="false"
            :height-offset="germanMetadataWrapped ? 36 : 0"
          />
        </div>
        <div
          class="desktop-review-dialog__footer"
          :class="{ 'desktop-review-dialog__footer--german': isGermanPrototype }"
        >
        <div v-if="confirmationToast" class="desktop-review-dialog__confirmation">
          <CdxMessage :key="confirmationToast" :type="confirmationToastType" :auto-dismiss="8000" allow-user-dismiss
            @auto-dismissed="clearConfirmationToast" @user-dismissed="clearConfirmationToast">
            {{ confirmationToast }}
          </CdxMessage>
        </div>

          <CdxButton v-if="watchInFooter" ref="watchFooterAnchor" size="medium"
            :aria-expanded="watchPopoverOpen" aria-controls="watch-page-popover"
            :aria-pressed="watchedChanges.has(modalReviewChange.title)"
            @click="toggleWatch(modalReviewChange.title)">
            <CdxIcon :icon="watchedChanges.has(modalReviewChange.title) ? (watchPeriods[modalReviewChange.title] === 'infinite' ? cdxIconUnStar : cdxIconHalfStar) : cdxIconStar" />
            {{ watchedChanges.has(modalReviewChange.title) ? 'Unwatch' : 'Watch' }}
          </CdxButton>
          <CdxButton size="medium" @click="requestThanks(modalReviewChange.title)">
            <CdxIcon :icon="cdxIconHeartOutline" />
            {{ thankedChanges.has(modalReviewChange.title) ? 'Thanked' : 'Thank' }}
          </CdxButton>
          <CdxButton size="medium" @click="requestUndo(modalReviewChange.title)">
            <CdxIcon :icon="cdxIconEditUndo" /> {{ undoneChanges.has(modalReviewChange.title) ? 'Restore' : 'Undo' }}
          </CdxButton>
          <CdxButton
            v-if="queueVersion === 'C'"
            size="medium"
            @click="queueVersion === 'C' ? togglePin() : markEditReviewed(modalReviewChange.title)"
          >
            <CdxIcon :icon="queueVersion === 'C' ? cdxIconPushPin : cdxIconCheck" />
            {{ queueVersion === 'C' ? (pinnedChanges.has(modalReviewChange.title) ? 'Unpin' : 'Pin') : (reviewedChanges.has(modalReviewChange.title) ? 'Viewed' : 'View') }}
          </CdxButton>
          <div class="desktop-review-dialog__navigation">
            <CdxButton
              size="medium"
              :icon-only="true"
              aria-label="Previous review change"
              :disabled="!adjacentReviewChange(-1)"
              @click="moveReviewModal(-1)"
            >
              <CdxIcon :icon="cdxIconPrevious" />
            </CdxButton>
            <CdxButton
              size="medium"
              :icon-only="true"
              aria-label="Next review change"
              @click="moveReviewModal(1)"
            >
              <CdxIcon :icon="cdxIconNext" />
            </CdxButton>
          </div>
        </div>
        </template>
      </CdxDialog>
      <UndoConfirmationDialog
        v-model:open="undoDialogOpen"
        desktop
        @confirmed="showUndoConfirmation"
      />
      <ThankConfirmationDialog
        v-model:open="thankDialogOpen"
        desktop
        @confirmed="showThankConfirmation"
      />
    </SpecialPageWrapper>
  </ChromeWrapper>
  <CdxToast
    v-if="confirmationToast && modalReviewIndex === null"
    standalone
    target="body"
    :type="confirmationToastType"
    :auto-dismiss="true"
    @auto-dismissed="clearConfirmationToast"
    @user-dismissed="clearConfirmationToast"
  >
    {{ confirmationToast }}
  </CdxToast>
</template>

<style scoped>
.queue-version-switch { display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin: 8px 0 24px; }
.queue-version-switch > span { margin-inline-end: auto; color: var(--color-subtle, #54595d); font-size: 14px; }
.view-more-edits { margin-top: 16px; }
.all-review-layout { display: grid; grid-template-columns: 180px minmax(0, 864px) 180px; gap: 40px; justify-content: center; }
.all-review-main { min-width: 0; }
.all-review-title-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; padding-bottom: 6px; border-bottom: 1px solid var(--border-color-base, #a2a9b1); }
.all-review-title-row .queue-version-switch { margin: 0; flex-wrap: wrap; }
.all-review-main h1 { margin: 0; font: 29px/1.4 Georgia, serif; }
.all-review-heading { display: flex; align-items: center; gap: 8px; margin: 8px 0 12px; }
.queue-refresh-button { margin-inline-start: auto; }
.all-review-heading h2 { margin: 0; font: bold 16px/1.5 sans-serif; }
.all-review-list { display: flex; flex-direction: column; }
.all-review-contents, .all-review-tools { padding-top: 60px; font-size: 14px; line-height: 1.6; }
.all-review-layout aside a { display: block; margin: 8px 0; color: var(--color-progressive, #36c); text-decoration: none; }
.all-review-layout aside hr { border: 0; border-top: 1px solid var(--border-color-subtle, #dadde3); }
.all-review-tools p { margin: 16px 0 0; color: var(--color-subtle, #54595d); }
.queue-loading { margin-bottom: 12px; color: var(--color-subtle, #54595d); font-size: 14px; }
.queue-loading > span { display: block; margin-top: 8px; }
.queue-empty { padding: 32px 16px; text-align: center; }
.queue-empty strong { display: block; color: var(--color-base, #202122); font-size: 20px; line-height: 1.4; }
.queue-empty p { margin: 8px 0 0; }
.queue-empty, .queue-end { color: var(--color-subtle, #54595d); margin: 24px 0; }
@media (max-width: 1100px) { .all-review-layout { grid-template-columns: minmax(0, 864px); } .all-review-layout aside { display: none; } }

.template-dashboard-shell {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}

.dashboard-view-control {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-100, 16px);
}

.dashboard-header-feedback {
  display: none;
  color: var(--color-progressive, #36c);
  text-decoration: none;
}

.dashboard-header-feedback:hover {
  text-decoration: underline;
}

.desktop-preview-style {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-100, 16px);
  box-sizing: border-box;
  width: 100%;
  padding: var(--spacing-75, 12px);
  border: 1px solid var(--border-color-subtle, #c8ccd1);
  border-radius: 2px;
  background: var(--background-color-base, #fff);
}

.desktop-preview-style > span {
  font-size: var(--font-size-small, 0.875rem);
  font-weight: var(--font-weight-bold, 700);
}

.dashboard-template-placeholder {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  color: var(--color-base--subtle, #54595d);
}

.dashboard-module-intro {
  margin: 0 0 var(--spacing-100, 16px);
  line-height: 1.6;
}

.desktop-review-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50, 8px);
  width: 100%;
}

.desktop-review-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-25, 4px);
  min-width: 0;
  padding: var(--spacing-100, 16px);
  border-bottom: 3px solid #eaecf0;
  border-radius: 2px;
}

.desktop-review-item:last-child {
  border-bottom: 0;
}

.desktop-review-item--modal {
  cursor: pointer;
}

.desktop-review-item--modal:hover,
.desktop-review-item--modal:focus-visible {
  background: var(--background-color-interactive-subtle, #f8f9fa);
}

.desktop-review-item--modal:focus-visible {
  outline: 2px solid var(--color-progressive, #36c);
  outline-offset: -2px;
}

.desktop-review-item__title,
.desktop-review-item__meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
  min-width: 0;
}

.desktop-review-item__title span,
.desktop-review-item__footer > p {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.desktop-review-item__title > .desktop-review-item__statuses {
  display: flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
  flex-shrink: 0;
  margin-inline-start: auto;
  overflow: visible;
}

.desktop-review-item__reviewed-status,
.desktop-review-item__undone-status,
.desktop-review-item__thanked-status {
  flex-shrink: 0;
  color: var(--color-icon-base, #202122);
}

.desktop-review-item__meta {
  gap: var(--spacing-25, 4px);
}

.desktop-review-item__username {
  color: var(--color-progressive, #36c);
  font-weight: var(--font-weight-bold, 700);
  text-decoration: none;
}

.desktop-review-item__username:hover {
  text-decoration: underline;
}

.desktop-review-item__footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--spacing-100, 16px);
  min-width: 0;
}

.desktop-review-item p {
  min-width: 0;
  margin: 0;
}

.preview-change-button {
  flex-shrink: 0;
}

.desktop-inline-diff {
  margin: var(--spacing-75, 12px) calc(var(--spacing-100, 16px) * -1)
    calc(var(--spacing-100, 16px) * -1);
  border-top: 1px solid var(--border-color-subtle, #c8ccd1);
}

.desktop-inline-diff__content {
  padding: 0;
  background: #f8f9fa;
  color: var(--color-base--subtle, #54595d);
  font-size: var(--font-size-small, 0.875rem);
  line-height: var(--line-height-small, 1.43);
}

.desktop-inline-diff__content p {
  margin: 0 0 var(--spacing-75, 12px);
  white-space: normal;
}

.desktop-inline-diff__content p:last-child {
  margin-bottom: 0;
}

.diff-addition {
  background: var(--background-color-success-subtle, #d5fdf4);
  text-decoration: underline;
  text-decoration-color: var(--border-color-success, #14866d);
  text-decoration-thickness: 2px;
}

.diff-removal {
  background: var(--background-color-error-subtle, #fee7e6);
  text-decoration: line-through;
  text-decoration-color: var(--border-color-error, #b32424);
  text-decoration-thickness: 2px;
}

.desktop-inline-diff__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-75, 12px);
  padding: var(--spacing-50, 8px) var(--spacing-100, 16px);
  background: #f8f9fa;
}

.desktop-inline-diff__reviewed--complete.cdx-button:enabled,
.desktop-inline-diff__reviewed--complete.cdx-button:enabled .cdx-icon {
  color: var(--color-icon-success, #099979);
}

.desktop-inline-diff__full-diff {
  margin-right: auto;
  font-weight: var(--font-weight-bold, 700);
}

.desktop-inline-diff__label-actions {
  display: flex;
  gap: var(--spacing-100, 16px);
  padding: var(--spacing-100, 16px);
  background: #f8f9fa;
}

.desktop-inline-diff__label-actions .cdx-button {
  display: inline-flex;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-50, 8px);
  min-height: 32px;
  padding: var(--spacing-25, 4px) var(--spacing-75, 12px);
  font-size: var(--font-size-small, 0.875rem);
  font-weight: var(--font-weight-bold, 700);
}

.desktop-review-dialog__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: calc(var(--spacing-100, 16px) * -1) -24px 0;
  padding: var(--spacing-75, 12px) var(--spacing-100, 16px);
  border-bottom: 1px solid var(--border-color-subtle, #c8ccd1);
}

.desktop-review-dialog__complete {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-200, 32px);
  text-align: center;
  line-height: 1.6;
}
.desktop-review-dialog__complete p { margin: 0; max-width: 32em; }

.watch-popover-content { width: 288px; max-width: 100%; }
.watch-popover-content p { margin: 0 0 var(--spacing-100, 16px); }

.desktop-review-dialog__page-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
}

.desktop-review-dialog__meta--german {
  flex-wrap: wrap;
  gap: var(--spacing-25, 4px);
}

.desktop-review-dialog__user {
  display: flex;
  align-items: center;
  gap: var(--spacing-25, 4px);
  color: var(--color-progressive, #36c);
  font-weight: var(--font-weight-bold, 700);
  text-decoration: none;
}

.desktop-review-dialog__user-links {
  display: flex;
  align-items: center;
  gap: var(--spacing-25, 4px);
}

.desktop-review-dialog__user-links > a:not(.desktop-review-dialog__user) {
  color: var(--color-progressive, #36c);
  text-decoration: none;
}

.desktop-review-dialog__secondary-user-link {
  color: var(--color-progressive, #36c);
}

.desktop-review-dialog__user-links > a:hover {
  text-decoration: underline;
}

.desktop-review-dialog__full-diff,
.desktop-inline-diff__full-diff {
  color: var(--color-progressive, #36c);
  font-weight: var(--font-weight-normal, 400);
  text-decoration: none;
  white-space: nowrap;
}

.desktop-review-dialog__full-diff:hover,
.desktop-inline-diff__full-diff:hover {
  text-decoration: underline;
}

.desktop-review-dialog__diff {
  margin-inline: -24px;
  padding: 0;
  border: 0;
  outline: 0;
  box-shadow: none;
  font-size: var(--font-size-small, 0.875rem);
  line-height: 1.6;
}

.desktop-review-dialog__diff p {
  margin: 0 0 var(--spacing-100, 16px);
}

.desktop-review-dialog__unchanged {
  color: var(--color-base--subtle, #72777d);
}

.desktop-review-dialog__confirmation {
  position: absolute;
  inset-inline: var(--spacing-100, 16px);
  bottom: calc(100% + var(--spacing-50, 8px));
  z-index: 4;
  min-width: 0;
  box-shadow: var(--box-shadow-drop-medium);
}

.desktop-review-dialog__footer {
  position: relative;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-50, 8px);
  margin: 0 -24px -24px;
  padding: var(--spacing-75, 12px) var(--spacing-100, 16px);
  border-top: 1px solid var(--border-color-subtle, #c8ccd1);
  background: var(--background-color-base, #fff);
}

.desktop-review-dialog__footer > .cdx-button {
  flex: 1 1 0;
  min-width: 0;
  width: 0;
  max-width: none;
  justify-content: center;
  font-weight: var(--font-weight-bold, 700);
  text-align: center;
}

.desktop-review-dialog__completion-actions {
  display: flex;
  margin-inline-start: auto;
  gap: var(--spacing-50, 8px);
}

.desktop-review-dialog__navigation {
  display: flex;
  margin-inline-start: auto;
  gap: var(--spacing-50, 8px);
}

.desktop-review-dialog__navigation .cdx-button {
  width: 32px;
  min-width: 32px;
  height: 32px;
  min-height: 32px;
  padding: 0;
}

.desktop-modal-confirmation__description {
  margin: 0 0 var(--spacing-100, 16px);
  font-size: var(--font-size-medium, 1rem);
  line-height: 1.6;
}

.desktop-modal-confirmation__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-75, 12px);
  margin-top: var(--spacing-150, 24px);
}

.desktop-modal-confirmation__actions .cdx-button {
  flex: 0 0 auto;
  width: auto;
}

:deep(.desktop-review-dialog .cdx-dialog__frame) {
  width: min(512px, calc(100vw - 32px));
}

:deep(.desktop-review-dialog--german .cdx-dialog__frame) {
  width: min(760px, calc(100vw - 32px));
}

:deep(.desktop-review-dialog .cdx-dialog__body) {
  overflow: hidden;
}

:deep(.desktop-review-dialog--confirmation .cdx-dialog__header__close-button) {
  display: none;
}

:deep(.desktop-review-dialog__diff iframe) {
  border: 0;
  outline: 0;
  box-shadow: none;
}

/* The dialog and its body stay fixed; the embedded diff owns scrolling. */
:global(.desktop-review-dialog:not(.desktop-review-dialog--confirmation)) {
  height: min(760px, calc(100dvh - 48px));
  max-height: calc(100dvh - 48px);
  overflow: hidden;
}
:global(.desktop-review-dialog:not(.desktop-review-dialog--confirmation) .cdx-dialog__body) {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}
:global(.desktop-review-dialog:not(.desktop-review-dialog--confirmation) .desktop-review-dialog__meta),
:global(.desktop-review-dialog:not(.desktop-review-dialog--confirmation) .desktop-review-dialog__footer) {
  flex: 0 0 auto;
  margin: 0;
}
:global(.desktop-review-dialog:not(.desktop-review-dialog--confirmation) .desktop-review-dialog__diff) {
  flex: 1 1 auto;
  min-height: 0;
  margin: 0;
  overflow: hidden;
}
:global(.desktop-review-dialog .desktop-review-dialog__diff .wikipedia-diff-content),
:global(.desktop-review-dialog .desktop-review-dialog__diff iframe) {
  height: 100% !important;
  min-height: 0;
}

.discussion-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50, 8px);
  width: 100%;
}

.discussion-item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-25, 4px);
  padding: var(--spacing-100, 16px);
  border: 1px solid var(--border-color-base, #a2a9b1);
  border-radius: 2px;
}

.discussion-item__counts {
  position: absolute;
  inset-block-start: var(--spacing-100, 16px);
  inset-inline-end: var(--spacing-100, 16px);
  display: flex;
  align-items: center;
}

.discussion-item a,
.discussion-footer a {
  color: var(--color-progressive, #36c);
  text-decoration: none;
}

.discussion-footer {
  margin: var(--spacing-100, 16px) 0 0;
}

.policy-item {
  padding: var(--spacing-75, 12px) 0;
  border-bottom: 1px solid var(--border-color-subtle, #c8ccd1);
}

.policy-item:last-child {
  border-bottom: 0;
}

.policy-item summary {
  font-weight: var(--font-weight-bold, 700);
  cursor: pointer;
}

.policy-item p {
  margin: var(--spacing-25, 4px) 0 0 var(--spacing-125, 20px);
  line-height: 1.5;
}

.dashboard-impact-rows {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50, 8px);
  font-size: 14px;
  line-height: 1.4;
  color: var(--color-base, #202122);
}

.dashboard-impact-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: var(--spacing-50, 8px);
  row-gap: var(--spacing-25, 4px);
}

.dashboard-impact-icon {
  flex-shrink: 0;
  color: var(--color-base--subtle, #54595d);
}

.dashboard-impact-metric {
  color: var(--color-progressive, #36c);
  font-weight: var(--font-weight-bold, 700);
  min-width: 1.25em;
}

.dashboard-preview-line {
  display: flex;
  align-items: center;
  gap: var(--spacing-25);
  margin: 0;
  color: var(--color-base);
}

.dashboard-preview-line--stacked {
  align-items: flex-start;
}

.dashboard-preview-link {
  color: var(--color-progressive);
  text-decoration: underline;
}

:deep(.dashboard-slot--mobile-primary .dashboard-module__body) {
  min-height: 3rem;
}

:deep(.dashboard-active-discussions-mobile .mobile-card__button) {
  background: var(--background-color-interactive-subtle, #f8f9fa);
  color: var(--color-base, #202122);
  border: 1px solid var(--border-color-interactive, #72777d);
}

:deep(.dashboard-slot--desktop-primary .dashboard-module) {
  min-height: 8rem;
  width: 100%;
}

@media (max-width: 639px) {
  :deep(.special-page-wrapper[data-skin='mobile'] .special-page-wrapper__header) {
    row-gap: 0;
  }

  :deep(.special-page-wrapper[data-skin='mobile'] .special-page-wrapper__header-aside),
  :deep(.special-page-wrapper[data-skin='mobile'] .special-page-wrapper__actions) {
    width: 100%;
    justify-content: flex-start;
  }

  .special-page-wrapper[data-skin='mobile'] .dashboard-view-control {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-50, 8px);
  }

  .special-page-wrapper[data-skin='mobile'] .dashboard-header-feedback {
    display: inline-flex;
  }

  :deep(.special-page-wrapper[data-skin='mobile'] .personal-dashboard-clone .dashboard-mobile-banner) {
    display: none;
  }
}

</style>
