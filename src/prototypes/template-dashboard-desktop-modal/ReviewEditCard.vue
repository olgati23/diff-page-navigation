<script setup lang="ts">
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import {
  cdxIconCheck,
  cdxIconPushPin,
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
  pinned?: boolean
}>()
defineEmits<{ open: []; unpin: [] }>()
</script>

<template>
  <div class="review-edit-card-wrap">
  <button
    type="button"
    class="review-edit-card"
    :class="{ 'review-edit-card--seen': seen, 'review-edit-card--expanded': expanded, 'review-edit-card--pinned': pinned }"
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
  <CdxButton v-if="pinned" class="review-edit-card__unpin" weight="quiet" :icon-only="true"
    :aria-label="`Unpin ${change.title}`" title="Unpin" @click.stop="$emit('unpin')">
    <CdxIcon :icon="cdxIconPushPin" size="small" />
  </CdxButton>
  </div>
</template>

<style scoped>
.review-edit-card-wrap { position: relative; }
.review-edit-card__unpin { position: absolute; top: 8px; right: 8px; }
.review-edit-card--pinned .review-edit-card__heading { padding-inline-end: 32px; box-sizing: border-box; }

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
.review-edit-card-wrap:last-child > .review-edit-card--expanded {
  border-bottom: 0;
}
.review-edit-card:not(.review-edit-card--expanded) {
  border: 1px solid var(--border-color-base, #a2a9b1);
  border-radius: 2px;
}
.review-edit-card--expanded {
  border-radius: 0;
  padding: 12px;
}
.review-edit-card--seen {
  background: var(--background-color-neutral, #eaecf0);
}
.review-edit-card:hover {
  box-shadow: inset 0 0 0 1px var(--border-color-interactive, #72777d);
}
.review-edit-card--expanded:hover {
  box-shadow: none;
  background: var(--background-color-interactive-subtle, #f8f9fa);
}
.review-edit-card--expanded.review-edit-card--seen:hover {
  background: var(--background-color-interactive, #eaecf0);
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
