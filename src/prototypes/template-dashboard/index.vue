<script setup lang="ts">
import { CdxIcon } from '@wikimedia/codex'
import { cdxIconCheck, cdxIconEdit, cdxIconMessage, cdxIconUserTalk } from '@wikimedia/codex-icons'
import { RouterLink } from 'vue-router'

import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import { useConfig } from '@/composables/useConfig'
import Dashboard from '@/components/dashboard/Dashboard.vue'
import DashboardModule from '@/components/dashboard/DashboardModule.vue'
import SpecialPageWrapper from '@/components/SpecialPageWrapper.vue'
import { reviewChanges } from './reviewChanges'

definePage({
  meta: {
    title: 'Template: Dashboard',
    description: 'Template for dashboard prototypes that contain "box modules".',
  },
})

const { pageTitle } = useConfig()

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
  <ChromeWrapper :last-edited-notice="false">
    <SpecialPageWrapper :title="pageTitle" help>
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

            <DashboardModule :to="HOME" title="Active discussions" cta="View more">
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
            <DashboardModule :to="REVIEW_CHANGES_ROUTE" :title="MODULE.thankTitle" cta="View more edits">
              <p class="dashboard-preview-line">
                <CdxIcon :icon="cdxIconEdit" size="small" aria-hidden="true" />
                <span>{{ reviewChanges[0].editor }} edited the {{ reviewChanges[0].title }} article</span>
              </p>
            </DashboardModule>
            <DashboardModule :to="HOME" title="Active discussions" cta="View more">
              <p class="dashboard-preview-line dashboard-preview-line--stacked">
                <CdxIcon :icon="cdxIconMessage" size="small" aria-hidden="true" />
                <span><em>What should mentorship be?</em><br />Latest comment: <span class="dashboard-preview-link">18 minutes ago</span></span>
              </p>
            </DashboardModule>
            <DashboardModule title="Policies and guidelines">
              <p class="dashboard-template-placeholder">Review best practices to create a free and reliable encyclopedia.</p>
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
          </template>
        </Dashboard>
      </div>
    </SpecialPageWrapper>
  </ChromeWrapper>
</template>

<style scoped>
.template-dashboard-shell {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}

.dashboard-template-placeholder {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  color: var(--color-base--subtle, #54595d);
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

:deep(.dashboard-slot--desktop-primary .dashboard-module) {
  min-height: 8rem;
}
</style>
