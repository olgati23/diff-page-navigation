<script setup lang="ts">
import { CdxButton, CdxDialog } from '@wikimedia/codex'

const props = defineProps<{
  open: boolean
  desktop?: boolean
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  confirmed: []
}>()

function close(): void {
  emit('update:open', false)
}

function confirm(): void {
  emit('confirmed')
  close()
}
</script>

<template>
  <CdxDialog
    :open="props.open"
    title="Publicly send ‘Thanks’"
    class="thank-confirmation-dialog"
    :class="{ 'thank-confirmation-dialog--desktop': props.desktop }"
    @update:open="emit('update:open', $event)"
  >
    <p class="thank-confirmation-dialog__description">
      It is an easy way to show appreciation for an editor’s work on Wikipedia. ‘Thanks’ cannot
      be undone and are publicly viewable.
    </p>
    <div
      class="thank-confirmation-dialog__actions"
      :class="{ 'thank-confirmation-dialog__actions--desktop': props.desktop }"
    >
      <template v-if="props.desktop">
        <CdxButton weight="normal" @click="close">Cancel</CdxButton>
        <CdxButton action="progressive" weight="normal" @click="confirm">Thank</CdxButton>
      </template>
      <template v-else>
        <CdxButton action="progressive" weight="normal" @click="confirm">Thank</CdxButton>
        <CdxButton weight="normal" @click="close">Cancel</CdxButton>
      </template>
    </div>
  </CdxDialog>
</template>

<style scoped>
.thank-confirmation-dialog__description {
  margin: 0;
  font-size: var(--font-size-medium, 1rem);
  line-height: 1.6;
}

.thank-confirmation-dialog__actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75, 12px);
  margin-top: var(--spacing-150, 24px);
}

.thank-confirmation-dialog__actions .cdx-button {
  width: 100%;
  max-width: none;
}

.thank-confirmation-dialog__actions--desktop {
  flex-direction: row;
  justify-content: flex-end;
}

.thank-confirmation-dialog__actions--desktop .cdx-button {
  width: auto;
  min-width: 88px;
}
</style>

<style>
.cdx-dialog-backdrop:has(.thank-confirmation-dialog) {
  z-index: 1100;
}

.thank-confirmation-dialog {
  width: calc(100vw - 48px);
  max-width: 352px;
}

.thank-confirmation-dialog--desktop {
  width: calc(100vw - 32px);
  max-width: 512px;
}

.thank-confirmation-dialog .cdx-dialog__header__close-button {
  display: none;
}
</style>
