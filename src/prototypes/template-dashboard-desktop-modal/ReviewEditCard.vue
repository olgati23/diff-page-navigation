<script setup lang="ts">
import { CdxIcon } from '@wikimedia/codex'
import {
  cdxIconCheck,
  cdxIconEditUndo,
  cdxIconHeartOutline,
  cdxIconUserAvatar,
} from '@wikimedia/codex-icons'
import type { ReviewChange } from './reviewChanges'

defineProps<{
  change: ReviewChange
  seen?: boolean
  thanked?: boolean
  viewed?: boolean
  undone?: boolean
  expanded?: boolean
}>()
defineEmits<{ open: [] }>()
</script>

<template>
  <button
    type="button"
    class="review-edit-card"
    :class="{ 'review-edit-card--seen': seen, 'review-edit-card--expanded': expanded }"
    @click="$emit('open')"
  >
    <span class="review-edit-card__heading">
      <strong>{{ change.title }}</strong>
      <span class="review-edit-card__statuses">
        <CdxIcon v-if="undone" :icon="cdxIconEditUndo" size="small" icon-label="Edit undone" />
        <CdxIcon v-if="viewed" :icon="cdxIconCheck" size="small" icon-label="Viewed" />
        <CdxIcon
          v-if="thanked"
          :icon="cdxIconHeartOutline"
          size="small"
          icon-label="Editor thanked"
        />
      </span>
    </span>
    <span class="review-edit-card__description">{{ change.description }}</span>
    <span class="review-edit-card__summary">{{ change.summary }}</span>
    <span class="review-edit-card__meta"
      ><CdxIcon :icon="cdxIconUserAvatar" size="x-small" />{{ change.editor }} ·
      {{ change.time }}</span
    >
  </button>
</template>

<style scoped>
.review-edit-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding: 16px;
  border: 0;
  border-bottom: 1px solid var(--border-color-subtle, #dadde3);
  background: var(--background-color-base, #fff);
  color: var(--color-base, #202122);
  text-align: start;
  font: inherit;
  font-size: 14px;
  line-height: 1.5;
  cursor: pointer;
}
.review-edit-card:last-child {
  border-bottom: 0;
}
.review-edit-card--expanded,
.review-edit-card--expanded:last-child {
  border: 1px solid var(--border-color-base, #a2a9b1);
  border-radius: 2px;
  padding: 12px;
}
.review-edit-card--seen {
  background: var(--background-color-neutral, #eaecf0);
}
.review-edit-card:hover {
  box-shadow: inset 0 0 0 1px var(--border-color-interactive, #72777d);
}
.review-edit-card:focus-visible {
  outline: 2px solid var(--color-progressive, #36c);
  outline-offset: 2px;
}
.review-edit-card__heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
}
.review-edit-card__statuses {
  display: inline-flex;
  gap: 8px;
  flex-shrink: 0;
  margin-inline-start: auto;
}
.review-edit-card__description,
.review-edit-card__summary,
.review-edit-card__meta {
  color: var(--color-subtle, #54595d);
}
.review-edit-card__summary,
.review-edit-card__meta {
  font-size: 13px;
}
.review-edit-card__meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}
</style>
