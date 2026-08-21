<script setup lang="ts">
import {
  CdxButton,
  CdxDialog,
  CdxIcon,
  CdxTextInput,
  CdxToast,
} from '@wikimedia/codex'
import {
  cdxIconCheck,
  cdxIconSuccess,
  cdxIconEdit,
  cdxIconEditUndo,
  cdxIconCollapse,
  cdxIconArrowNext,
  cdxIconArrowPrevious,
  cdxIconExpand,
  cdxIconHeart,
  cdxIconHeartOutline,
  cdxIconMessage,
  cdxIconUserAvatar,
  cdxIconUserTalk,
} from '@wikimedia/codex-icons'
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import { useConfig } from '@/composables/useConfig'
import Dashboard from '@/components/dashboard/Dashboard.vue'
import DashboardModule from '@/components/dashboard/DashboardModule.vue'
import SpecialPageWrapper from '@/components/SpecialPageWrapper.vue'
import type { Skin } from '@/theme'
import WikipediaDiffContent from './review-changes/WikipediaDiffContent.vue'
import ThankConfirmationDialog from './review-changes/ThankConfirmationDialog.vue'
import UndoConfirmationDialog from './review-changes/UndoConfirmationDialog.vue'
import { reviewChanges, type ReviewChange } from './reviewChanges'

const desktopReviewIcon = '<circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="m14.806 7.249-4.906 5.956H8.801L6 11.105l1.2-1.6 2.024 1.518L13.244 6z"/>'
const completedUndoIcon = '<path d="m11.76 12.463-5.213 5.216a1 1 0 0 1-.394.242L1.91 19.335.64 18.076l1.413-4.243a1 1 0 0 1 .242-.39l5.222-5.222z"/><path d="m14.124 1.5-3 3H14a6 6 0 0 1 6 6V14h-2v-3.5a4 4 0 0 0-4-4h-2.876l3 3-1.414 1.414-4.707-4.707V4.793L12.71.086z"/>'

definePage({
  meta: {
    title: 'Template: Dashboard',
    description: 'Template for dashboard prototypes that contain "box modules".',
  },
})

const { pageTitle } = useConfig()
const dashboardView: Skin = 'desktop'
const expandedReviewChange = ref<string | null>(null)
const desktopReviewPresentation = ref('icons')
const modalReviewIndex = ref<number | null>(null)
const undoDialogOpen = ref(false)
const thankDialogOpen = ref(false)
const confirmationToast = ref('')
const confirmationToastType = ref<'success' | 'notice'>('success')
const reviewedChanges = ref<Set<string>>(new Set())
const thankedChanges = ref<Set<string>>(new Set())
const undoneChanges = ref<Set<string>>(new Set())
const modalConfirmation = ref<'undo' | 'thank' | null>(null)
const modalUndoReason = ref('')

watch(desktopReviewPresentation, () => {
  expandedReviewChange.value = null
  modalReviewIndex.value = null
  undoDialogOpen.value = false
  thankDialogOpen.value = false
  modalConfirmation.value = null
})

const desktopReviewChanges = reviewChanges

const modalReviewChange = computed(
  () => desktopReviewChanges[modalReviewIndex.value ?? 0],
)
const activeReviewEditor = computed(() => {
  if (modalReviewIndex.value !== null) return modalReviewChange.value.editor
  return desktopReviewChanges.find((change) => change.title === expandedReviewChange.value)?.editor ??
    desktopReviewChanges[0].editor
})

function openReviewModal(index: number): void {
  if (desktopReviewPresentation.value === 'modal') modalReviewIndex.value = index
}

function moveReviewModal(direction: -1 | 1): void {
  if (modalReviewIndex.value === null) return
  const next = modalReviewIndex.value + direction
  if (next >= 0 && next < desktopReviewChanges.length) modalReviewIndex.value = next
}

function updateReviewModalOpen(open: boolean): void {
  if (!open) {
    modalReviewIndex.value = null
    modalConfirmation.value = null
  }
}

function showUndoConfirmation(): void {
  confirmationToastType.value = 'success'
  confirmationToast.value = 'Your edit was saved.'
  const title = modalReviewIndex.value !== null ? modalReviewChange.value.title : expandedReviewChange.value
  if (!title) return
  const undone = new Set(undoneChanges.value)
  undone.add(title)
  undoneChanges.value = undone
  const reviewed = new Set(reviewedChanges.value)
  reviewed.delete(title)
  reviewedChanges.value = reviewed
  if (modalReviewIndex.value !== null) moveReviewModal(1)
  else {
    const currentIndex = desktopReviewChanges.findIndex((change) => change.title === title)
    if (currentIndex >= 0 && currentIndex < desktopReviewChanges.length - 1) {
      expandedReviewChange.value = desktopReviewChanges[currentIndex + 1].title
    }
  }
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
    confirmationToast.value = 'Edit restored.'
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
  confirmationToast.value = `You thanked ${activeReviewEditor.value}.`
}

function requestThanks(changeTitle?: string): void {
  const title = changeTitle ?? modalReviewChange.value.title
  if (thankedChanges.value.has(title)) {
    confirmationToastType.value = 'notice'
    confirmationToast.value = "A 'Thanks' cannot be undone."
    return
  }
  thankDialogOpen.value = true
}

function markEditReviewed(changeTitle?: string): void {
  confirmationToastType.value = 'success'
  const title = changeTitle ?? modalReviewChange.value.title
  const next = new Set(reviewedChanges.value)
  if (next.has(title)) {
    next.delete(title)
    confirmationToast.value = 'Edit marked as unreviewed on your dashboard only.'
  } else {
    next.add(title)
    confirmationToast.value = 'Edit marked as reviewed on your dashboard only.'
    if (modalReviewIndex.value !== null) {
      moveReviewModal(1)
    } else {
      const currentIndex = desktopReviewChanges.findIndex((change) => change.title === title)
      if (currentIndex >= 0 && currentIndex < desktopReviewChanges.length - 1) {
        expandedReviewChange.value = desktopReviewChanges[currentIndex + 1].title
      }
    }
  }
  reviewedChanges.value = next
}

function openFullDiff(change: ReviewChange): void {
  const title = encodeURIComponent(change.title.replaceAll(' ', '_'))
  const url =
    `https://en.wikipedia.org/w/index.php?title=${title}` +
    `&diff=${change.revisionId}` +
    `&oldid=${change.oldRevisionId}&diffmode=visual`
  window.open(url, '_blank', 'noopener,noreferrer')
}

function userPageUrl(editor: string): string {
  return `${import.meta.env.BASE_URL}template-user-page-readonly?username=${encodeURIComponent(editor)}`
}

function userTalkPageUrl(editor: string): string {
  return `https://en.wikipedia.org/wiki/User_talk:${encodeURIComponent(editor.replaceAll(' ', '_'))}`
}

function userContributionsUrl(editor: string): string {
  return `https://en.wikipedia.org/wiki/Special:Contributions/${encodeURIComponent(editor.replaceAll(' ', '_'))}`
}

function openUserTalkPage(editor: string): void {
  window.open(userTalkPageUrl(editor), '_blank', 'noopener,noreferrer')
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
    <SpecialPageWrapper :title="pageTitle" actions>
      <template #actions>
        <div class="dashboard-view-control">
          <RouterLink :to="HOME" class="dashboard-header-feedback">
            Share feedback
          </RouterLink>
        </div>
      </template>

      <div class="template-dashboard-shell">
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
              cta="View more edits"
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
              <div class="desktop-review-list">
                <article
                  v-for="(change, changeIndex) in desktopReviewChanges"
                  :key="change.title"
                  class="desktop-review-item"
                  :class="{ 'desktop-review-item--modal': desktopReviewPresentation === 'modal' }"
                  :role="desktopReviewPresentation === 'modal' ? 'button' : undefined"
                  :tabindex="desktopReviewPresentation === 'modal' ? 0 : undefined"
                  @click="openReviewModal(changeIndex)"
                  @keydown.enter.prevent="openReviewModal(changeIndex)"
                  @keydown.space.prevent="openReviewModal(changeIndex)"
                >
                  <div class="desktop-review-item__title">
                    <strong>{{ change.title }}</strong>
                    <span v-if="change.description">{{ change.description }}</span>
                  <CdxIcon
                      v-if="undoneChanges.has(change.title)"
                      :icon="cdxIconEditUndo"
                      size="small"
                      class="desktop-review-item__undone-status"
                      icon-label="Edit undone"
                    />
                    <CdxIcon
                      v-else-if="reviewedChanges.has(change.title)"
                      :icon="desktopReviewIcon"
                      size="small"
                      class="desktop-review-item__reviewed-status"
                      icon-label="Edit reviewed"
                    />
                  </div>
                  <div class="desktop-review-item__meta">
                    <CdxIcon :icon="cdxIconUserAvatar" size="x-small" />
                    <a
                      :href="userPageUrl(change.editor)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="desktop-review-item__username"
                      @click.stop
                    >
                      {{ change.editor }}
                    </a>
                    <span>· {{ change.time }}</span>
                  </div>
                  <div class="desktop-review-item__footer">
                    <p>{{ change.summary }}</p>
                    <CdxButton
                      v-if="desktopReviewPresentation !== 'modal'"
                      weight="quiet"
                      :icon-only="true"
                      aria-label="Preview change"
                      :aria-expanded="expandedReviewChange === change.title"
                      class="preview-change-button"
                      @click="expandedReviewChange = expandedReviewChange === change.title ? null : change.title"
                    >
                      <CdxIcon :icon="expandedReviewChange === change.title ? cdxIconCollapse : cdxIconExpand" />
                    </CdxButton>
                  </div>
                  <div
                    v-if="expandedReviewChange === change.title"
                    class="desktop-inline-diff"
                  >
                    <div
                      v-if="desktopReviewPresentation === 'labels'"
                      class="desktop-inline-diff__label-actions"
                      aria-label="Review actions"
                    >
                      <CdxButton @click.stop="markEditReviewed(change.title)">
                        <CdxIcon :icon="cdxIconCheck" />
                        {{ reviewedChanges.has(change.title) ? 'Reviewed' : 'Review' }}
                      </CdxButton>
                      <CdxButton @click.stop="requestUndo(change.title)">
                        <CdxIcon :icon="undoneChanges.has(change.title) ? completedUndoIcon : cdxIconEditUndo" />
                        {{ undoneChanges.has(change.title) ? 'Restore' : 'Undo' }}
                      </CdxButton>
                      <CdxButton @click.stop="requestThanks(change.title)">
                        <CdxIcon :icon="thankedChanges.has(change.title) ? cdxIconHeart : cdxIconHeartOutline" />
                        {{ thankedChanges.has(change.title) ? 'Thanked' : 'Thank' }}
                      </CdxButton>
                    </div>
                    <div class="desktop-inline-diff__content">
                      <WikipediaDiffContent :change="displayedChange(change)" />
                    </div>
                    <div
                      v-if="desktopReviewPresentation === 'icons'"
                      class="desktop-inline-diff__actions"
                      aria-label="Review actions"
                    >
                      <CdxButton
                        weight="normal"
                        size="small"
                        class="desktop-inline-diff__full-diff"
                        @click.stop="openFullDiff(change)"
                      >
                        Full diff
                      </CdxButton>
                      <CdxButton
                        weight="quiet"
                        :icon-only="true"
                        aria-label="Open user talk page"
                        @click.stop="openUserTalkPage(change.editor)"
                      >
                        <CdxIcon :icon="cdxIconUserTalk" />
                      </CdxButton>
                      <CdxButton
                        weight="quiet"
                        :icon-only="true"
                        :aria-label="thankedChanges.has(change.title) ? 'Thanked' : 'Thank'"
                        @click.stop="requestThanks(change.title)"
                      >
                        <CdxIcon :icon="thankedChanges.has(change.title) ? cdxIconHeart : cdxIconHeartOutline" />
                      </CdxButton>
                      <CdxButton
                        weight="quiet"
                        :icon-only="true"
                        aria-label="Undo"
                        @click.stop="requestUndo(change.title)"
                      >
                        <CdxIcon :icon="undoneChanges.has(change.title) ? completedUndoIcon : cdxIconEditUndo" />
                      </CdxButton>
                      <CdxButton
                        weight="quiet"
                        :icon-only="true"
                        aria-label="Mark edit as reviewed"
                        @click.stop="markEditReviewed(change.title)"
                      >
                        <CdxIcon :icon="reviewedChanges.has(change.title) ? cdxIconSuccess : desktopReviewIcon" />
                      </CdxButton>
                    </div>
                  </div>
                </article>
              </div>
              <p class="discussion-footer">View more edits in the <a href="#" @click.prevent>recent changes page</a></p>
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

      <CdxDialog
        :open="modalReviewIndex !== null"
        :title="modalConfirmation === 'undo'
          ? 'Undo edit'
          : modalConfirmation === 'thank'
            ? 'Publicly send ‘Thanks’'
            : modalReviewChange.title"
        :subtitle="modalConfirmation ? undefined : `Revision from ${modalReviewChange.revisionDate} (UTC)`"
        :use-close-button="!modalConfirmation"
        class="desktop-review-dialog"
        :class="{ 'desktop-review-dialog--confirmation': modalConfirmation }"
        @update:open="updateReviewModalOpen"
      >
        <template v-if="modalConfirmation === 'undo'">
          <p class="desktop-modal-confirmation__description">
            This will undo the change(s) shown in this revision. Please provide a reason for
            undoing the edit(s).
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
            cannot be undone and are publicly viewable.
          </p>
          <div class="desktop-modal-confirmation__actions">
            <CdxButton @click="modalConfirmation = null">Cancel</CdxButton>
            <CdxButton action="progressive" weight="normal" @click="confirmModalAction">
              Thank
            </CdxButton>
          </div>
        </template>
        <template v-else>
        <div class="desktop-review-dialog__meta">
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
            <a
              :href="userTalkPageUrl(modalReviewChange.editor)"
              target="_blank"
              rel="noopener noreferrer"
            >talk</a>
            <span aria-hidden="true">|</span>
            <a
              :href="userContributionsUrl(modalReviewChange.editor)"
              target="_blank"
              rel="noopener noreferrer"
            >contribs</a>
            <span aria-hidden="true">)</span>
          </div>
          <CdxButton
            weight="quiet"
            class="desktop-review-dialog__full-diff"
            @click="openFullDiff(modalReviewChange)"
          >
            Full diff
          </CdxButton>
        </div>
        <div class="desktop-review-dialog__diff">
          <WikipediaDiffContent :change="displayedChange(modalReviewChange)" tall :show-heading="false" />
        </div>
        <div class="desktop-review-dialog__footer">
          <CdxButton size="medium" @click="openModalConfirmation('thank')">
            <CdxIcon :icon="cdxIconHeartOutline" /> Thank
          </CdxButton>
          <CdxButton size="medium" @click="requestUndo(modalReviewChange.title)">
            <CdxIcon :icon="cdxIconEditUndo" /> {{ undoneChanges.has(modalReviewChange.title) ? 'Restore' : 'Undo' }}
          </CdxButton>
          <CdxButton size="medium" @click="markEditReviewed(modalReviewChange.title)">
            <CdxIcon :icon="cdxIconCheck" />
            {{ reviewedChanges.has(modalReviewChange.title) ? 'Reviewed' : 'Review' }}
          </CdxButton>
          <div class="desktop-review-dialog__navigation">
            <CdxButton
              size="small"
              :icon-only="true"
              aria-label="Previous review change"
              :disabled="modalReviewIndex === 0"
              @click="moveReviewModal(-1)"
            >
              <CdxIcon :icon="cdxIconArrowPrevious" />
            </CdxButton>
            <CdxButton
              size="small"
              :icon-only="true"
              aria-label="Next review change"
              :disabled="modalReviewIndex === desktopReviewChanges.length - 1"
              @click="moveReviewModal(1)"
            >
              <CdxIcon :icon="cdxIconArrowNext" />
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
      <CdxToast
        v-if="confirmationToast"
        standalone
        :type="confirmationToastType"
        :auto-dismiss="true"
        @auto-dismissed="clearConfirmationToast"
        @user-dismissed="clearConfirmationToast"
      >
        {{ confirmationToast }}
      </CdxToast>
    </SpecialPageWrapper>
  </ChromeWrapper>
</template>

<style scoped>
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
  box-sizing: border-box;
  width: calc(100% + var(--spacing-200, 32px));
  margin-inline: calc(var(--spacing-100, 16px) * -1);
  border: 3px solid #eaecf0;
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

.desktop-review-item__reviewed-status {
  flex-shrink: 0;
  margin-inline-start: auto;
  color: var(--color-icon-base, #202122);
}

.desktop-review-item__undone-status {
  flex-shrink: 0;
  margin-inline-start: auto;
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

.desktop-review-dialog__user-links > a:hover {
  text-decoration: underline;
}

.desktop-review-dialog__full-diff {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-25, 4px);
  font-weight: var(--font-weight-bold, 700);
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

.desktop-review-dialog__footer {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
  gap: var(--spacing-50, 8px);
  margin: 0 -24px -24px;
  padding: var(--spacing-75, 12px) var(--spacing-100, 16px);
  border-top: 1px solid var(--border-color-subtle, #c8ccd1);
  background: var(--background-color-base, #fff);
}

.desktop-review-dialog__footer > .cdx-button {
  justify-content: center;
  font-weight: var(--font-weight-bold, 700);
}

.desktop-review-dialog__navigation {
  display: flex;
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
  min-width: 88px;
}

:deep(.desktop-review-dialog .cdx-dialog__frame) {
  width: min(512px, calc(100vw - 32px));
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

.discussion-list {
  box-sizing: border-box;
  width: calc(100% + var(--spacing-200, 32px));
  margin-inline: calc(var(--spacing-100, 16px) * -1);
  border: 3px solid #eaecf0;
}

.discussion-item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-25, 4px);
  padding: var(--spacing-100, 16px);
  border-bottom: 3px solid #eaecf0;
  border-radius: 2px;
}

.discussion-item:last-child {
  border-bottom: 0;
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
