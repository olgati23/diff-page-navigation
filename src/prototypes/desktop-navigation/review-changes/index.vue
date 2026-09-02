<script setup lang="ts">
import { CdxButton, CdxCard, CdxIcon } from '@wikimedia/codex'
import { cdxIconInfoFilled, cdxIconPrevious, cdxIconUserAvatar } from '@wikimedia/codex-icons'
import { RouterLink } from 'vue-router'

import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import SpecialPageWrapper from '@/components/SpecialPageWrapper.vue'
import { useConfig } from '@/composables/useConfig'
import { reviewChanges } from '../reviewChanges'

const { pageTitle } = useConfig()

definePage({
  meta: {
    title: 'Review changes — Desktop navigation',
    description: 'Complete Review Changes queue for the Desktop navigation prototype.',
  },
})
</script>

<template>
  <ChromeWrapper skin="desktop" :last-edited-notice="false">
    <SpecialPageWrapper :title="pageTitle" actions>
      <template #actions>
        <RouterLink to="/" class="review-changes-page__feedback">Share feedback</RouterLink>
      </template>

      <header class="review-changes-page__subheader">
        <RouterLink
          to="/desktop-navigation"
          class="review-changes-page__back-button"
          aria-label="Back to personal dashboard"
        >
          <CdxIcon :icon="cdxIconPrevious" />
        </RouterLink>
        <h2>Review changes</h2>
        <CdxButton
          weight="quiet"
          :icon-only="true"
          aria-label="About review changes"
          class="review-changes-page__info-button"
        >
          <CdxIcon :icon="cdxIconInfoFilled" />
        </CdxButton>
      </header>

      <div class="review-changes-page__list">
        <article v-for="change in reviewChanges" :key="change.title" class="review-changes-page__item">
          <CdxCard>
            <template #title>{{ change.title }}</template>
            <template v-if="change.description" #description>{{ change.description }}</template>
            <template #supporting-text>
              <span class="review-changes-page__supporting-text">
                <span class="review-changes-page__meta">
                  <CdxIcon :icon="cdxIconUserAvatar" size="x-small" />
                  <span class="review-changes-page__username">{{ change.editor }}</span>
                  <span>· {{ change.time }}</span>
                </span>
                <span class="review-changes-page__summary">{{ change.summary }}</span>
              </span>
            </template>
          </CdxCard>
        </article>
      </div>
    </SpecialPageWrapper>
  </ChromeWrapper>
</template>

<style scoped>
.review-changes-page__feedback {
  color: var(--color-progressive, #36c);
  text-decoration: none;
}

.review-changes-page__feedback:hover {
  text-decoration: underline;
}

:deep(.special-page-wrapper__header) {
  margin-bottom: 0;
}

.review-changes-page__subheader {
  display: flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
  margin: 0 0 var(--spacing-100, 16px);
  padding: var(--spacing-50, 8px) 0;
  border-bottom: 1px solid var(--border-color-subtle, #c8ccd1);
}

.review-changes-page__subheader h2 {
  margin: 0;
  padding: 0;
  border: 0;
  font-family: var(--font-family-system-sans, system-ui, sans-serif);
  font-size: var(--font-size-large, 1.125rem);
  font-weight: var(--font-weight-bold, 700);
  line-height: var(--line-height-small, 1.375rem);
}

.review-changes-page__back-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--color-base, #202122);
  text-decoration: none;
}

.review-changes-page__back-button:hover {
  background: var(--background-color-interactive-subtle--hover, #eaecf0);
}

.review-changes-page__info-button {
  margin-inline-start: auto;
}

.review-changes-page__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50, 8px);
  width: 100%;
  max-width: 960px;
  margin-inline: auto;
}

.review-changes-page__item,
.review-changes-page__item .cdx-card {
  width: 100%;
  min-width: 0;
}

:deep(.review-changes-page__item .cdx-card__text) {
  width: 100%;
  min-width: 0;
}

.review-changes-page__supporting-text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-25, 4px);
}

.review-changes-page__meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-25, 4px);
}

.review-changes-page__username {
  color: var(--color-progressive, #36c);
  font-weight: var(--font-weight-bold, 700);
}

.review-changes-page__summary {
  color: var(--color-subtle, #54595d);
}
</style>
